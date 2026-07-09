import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";

import { getStore } from "@netlify/blobs";

import {
  captureToRecord,
  normalizeCategory,
  normalizeRecord,
  recordSummary,
} from "./tracker-schema.mjs";

export const TRACKER_STORE_NAME = "tucker-tracker-v1";
const INDEX_RETRIES = 5;

export function createTrackerRepository(customStore = null) {
  const store = customStore || getStore({ name: TRACKER_STORE_NAME, consistency: "strong" });

  return {
    async listItems(ownerId, { includeArchived = false } = {}) {
      const index = await readJSON(store, itemIndexKey(ownerId));
      const items = Array.isArray(index?.data?.items) ? index.data.items : [];
      return items
        .filter((item) => includeArchived || !item.record?.archived)
        .sort((left, right) => String(right.record?.updated_at || "").localeCompare(String(left.record?.updated_at || "")));
    },

    async getItem(ownerId, categoryInput, recordId) {
      const category = normalizeCategory(categoryInput);
      const entry = await readJSON(store, itemKey(ownerId, category, recordId));
      if (!entry) throw new NotFoundError("Record not found.");
      return { category, record: entry.data, etag: entry.etag };
    },

    async saveItem(ownerId, categoryInput, payload, { expectedEtag = null } = {}) {
      const category = normalizeCategory(categoryInput);
      let existingEntry = null;
      if (payload?.id) {
        existingEntry = await readJSON(store, itemKey(ownerId, category, payload.id));
      }

      const { record } = normalizeRecord(category, payload, { existing: existingEntry?.data || null });
      const key = itemKey(ownerId, category, record.id);
      const condition = existingEntry
        ? { onlyIfMatch: expectedEtag || existingEntry.etag }
        : { onlyIfNew: true };
      const result = await store.setJSON(key, record, {
        ...condition,
        metadata: { ownerId, category, updatedAt: record.updated_at },
      });

      if (!result.modified) throw new ConflictError("This record changed on another device. Reload it and try again.");

      const summary = recordSummary(category, record, result.etag || null);
      await updateJSONIndex(store, itemIndexKey(ownerId), (current) => {
        const items = Array.isArray(current.items) ? current.items : [];
        const withoutCurrent = items.filter((item) => !(item.category === category && item.record?.id === record.id));
        return { version: 1, updated_at: new Date().toISOString(), items: [...withoutCurrent, summary] };
      });

      return { category, record, etag: result.etag || null };
    },

    async archiveItem(ownerId, categoryInput, recordId, { expectedEtag = null } = {}) {
      const existing = await this.getItem(ownerId, categoryInput, recordId);
      return this.saveItem(
        ownerId,
        existing.category,
        { ...existing.record, archived: true },
        { expectedEtag: expectedEtag || existing.etag },
      );
    },

    async rebuildItemIndex(ownerId) {
      const prefix = `items/${keyPart(ownerId)}/`;
      const listed = await store.list({ prefix });
      const items = [];
      for (const blob of listed.blobs) {
        const entry = await readJSON(store, blob.key);
        if (!entry?.data) continue;
        const parts = blob.key.split("/");
        const category = normalizeCategory(parts.at(-2));
        items.push(recordSummary(category, entry.data, entry.etag || null));
      }
      await updateJSONIndex(store, itemIndexKey(ownerId), () => ({
        version: 1,
        updated_at: new Date().toISOString(),
        items,
      }));
      return items.length;
    },

    async createDeviceToken(ownerId, name) {
      const cleanedName = String(name || "").trim();
      if (!cleanedName) throw new TrackerStoreError("Device name is required.", 400);

      const id = randomUUID();
      const secret = randomBytes(32).toString("base64url");
      const token = `tkt.${id}.${secret}`;
      const createdAt = new Date().toISOString();
      const record = {
        id,
        owner_id: ownerId,
        name: cleanedName,
        secret_hash: hashSecret(secret),
        scope: "capture:create",
        created_at: createdAt,
        last_used_at: null,
        revoked_at: null,
      };
      const result = await store.setJSON(deviceTokenKey(id), record, { onlyIfNew: true });
      if (!result.modified) throw new ConflictError("Could not create a unique device token. Try again.");

      const summary = publicDevice(record);
      await updateJSONIndex(store, deviceIndexKey(ownerId), (current) => {
        const devices = Array.isArray(current.devices) ? current.devices : [];
        return { version: 1, updated_at: createdAt, devices: [...devices, summary] };
      });
      return { device: summary, token };
    },

    async listDevices(ownerId) {
      const index = await readJSON(store, deviceIndexKey(ownerId));
      return Array.isArray(index?.data?.devices) ? index.data.devices : [];
    },

    async revokeDeviceToken(ownerId, tokenId) {
      const key = deviceTokenKey(tokenId);
      const entry = await readJSON(store, key);
      if (!entry || entry.data.owner_id !== ownerId) throw new NotFoundError("Device token not found.");
      const revokedAt = new Date().toISOString();
      const updated = { ...entry.data, revoked_at: revokedAt };
      const result = await store.setJSON(key, updated, { onlyIfMatch: entry.etag });
      if (!result.modified) throw new ConflictError("The device token changed. Reload and try again.");

      await updateJSONIndex(store, deviceIndexKey(ownerId), (current) => ({
        version: 1,
        updated_at: revokedAt,
        devices: (current.devices || []).map((device) => device.id === tokenId ? publicDevice(updated) : device),
      }));
      return publicDevice(updated);
    },

    async capture(deviceToken, payload) {
      const verified = await verifyDeviceToken(store, deviceToken);
      const { category, record } = captureToRecord(payload);
      const saved = await this.saveItem(verified.record.owner_id, category, record);
      await markDeviceUsed(store, verified);
      return saved;
    },
  };
}

export class TrackerStoreError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = "TrackerStoreError";
    this.status = status;
  }
}

export class NotFoundError extends TrackerStoreError {
  constructor(message) {
    super(message, 404);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends TrackerStoreError {
  constructor(message) {
    super(message, 409);
    this.name = "ConflictError";
  }
}

async function verifyDeviceToken(store, token) {
  const match = /^tkt\.([0-9a-f-]{36})\.([A-Za-z0-9_-]+)$/.exec(String(token || ""));
  if (!match) throw new TrackerStoreError("Invalid capture token.", 401);
  const [, id, secret] = match;
  const entry = await readJSON(store, deviceTokenKey(id));
  if (!entry || entry.data.revoked_at) throw new TrackerStoreError("Capture token is not active.", 401);

  const expected = Buffer.from(entry.data.secret_hash, "hex");
  const actual = Buffer.from(hashSecret(secret), "hex");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throw new TrackerStoreError("Invalid capture token.", 401);
  }
  return { record: entry.data, etag: entry.etag };
}

async function markDeviceUsed(store, verified) {
  const updated = { ...verified.record, last_used_at: new Date().toISOString() };
  try {
    await store.setJSON(deviceTokenKey(updated.id), updated, { onlyIfMatch: verified.etag });
    await updateJSONIndex(store, deviceIndexKey(updated.owner_id), (current) => ({
      version: 1,
      updated_at: updated.last_used_at,
      devices: (current.devices || []).map((device) => device.id === updated.id ? publicDevice(updated) : device),
    }));
  } catch {
    // A successful capture should not fail just because last-used bookkeeping raced.
  }
}

async function updateJSONIndex(store, key, mutate) {
  for (let attempt = 0; attempt < INDEX_RETRIES; attempt += 1) {
    const current = await readJSON(store, key);
    const nextValue = mutate(current?.data || {});
    const condition = current ? { onlyIfMatch: current.etag } : { onlyIfNew: true };
    const result = await store.setJSON(key, nextValue, condition);
    if (result.modified) return result;
  }
  throw new ConflictError("The Tracker index is busy. Try again in a moment.");
}

async function readJSON(store, key) {
  return store.getWithMetadata(key, { type: "json", consistency: "strong" });
}

function itemKey(ownerId, category, recordId) {
  return `items/${keyPart(ownerId)}/${keyPart(category)}/${keyPart(recordId)}.json`;
}

function itemIndexKey(ownerId) {
  return `indexes/${keyPart(ownerId)}/items.json`;
}

function deviceTokenKey(id) {
  return `device-tokens/${keyPart(id)}.json`;
}

function deviceIndexKey(ownerId) {
  return `indexes/${keyPart(ownerId)}/devices.json`;
}

function keyPart(value) {
  return encodeURIComponent(String(value));
}

function hashSecret(secret) {
  return createHash("sha256").update(secret).digest("hex");
}

function publicDevice(record) {
  return {
    id: record.id,
    name: record.name,
    scope: record.scope,
    created_at: record.created_at,
    last_used_at: record.last_used_at,
    revoked_at: record.revoked_at,
  };
}
