import { randomUUID } from "node:crypto";

import { getStore } from "@netlify/blobs";

export const CONTENT_STORE_NAME = "tucker-site-content-v1";
export const CONTENT_KINDS = new Set(["photos", "projects"]);

export function createContentRepository(customStore = null) {
  const store = customStore || getStore({ name: CONTENT_STORE_NAME, consistency: "strong" });

  return {
    async list(kindInput, { includeArchived = true } = {}) {
      const kind = normalizeKind(kindInput);
      const listed = await store.list({ prefix: `content/${kind}/` });
      const entries = [];
      for (const blob of listed.blobs) {
        const entry = await store.getWithMetadata(blob.key, { type: "json", consistency: "strong" });
        if (!entry?.data) continue;
        if (!includeArchived && entry.data.archived) continue;
        entries.push({ kind, record: entry.data, etag: entry.etag || null, source: "studio" });
      }
      return entries.sort((left, right) => sortTimestamp(right.record).localeCompare(sortTimestamp(left.record)));
    },

    async get(kindInput, recordId) {
      const kind = normalizeKind(kindInput);
      const entry = await store.getWithMetadata(contentKey(kind, recordId), { type: "json", consistency: "strong" });
      if (!entry?.data) throw new ContentStoreError("Content entry not found.", 404);
      return { kind, record: entry.data, etag: entry.etag || null, source: "studio" };
    },

    async save(kindInput, payload, { expectedEtag = null } = {}) {
      const kind = normalizeKind(kindInput);
      const now = new Date().toISOString();
      const requestedId = payload?.id ? cleanId(payload.id) : "";
      const existing = requestedId
        ? await store.getWithMetadata(contentKey(kind, requestedId), { type: "json", consistency: "strong" })
        : null;
      const id = requestedId || makeRecordId(kind, payload);
      const record = normalizeRecord(kind, payload, {
        id,
        createdAt: existing?.data?.created_at || payload?.created_at || now,
        updatedAt: now,
      });
      const condition = existing
        ? { onlyIfMatch: expectedEtag || existing.etag }
        : { onlyIfNew: true };
      const result = await store.setJSON(contentKey(kind, id), record, {
        ...condition,
        metadata: { kind, updatedAt: now, archived: Boolean(record.archived) },
      });
      if (!result.modified) throw new ContentStoreError("This entry changed on another device. Reload and try again.", 409);
      return { kind, record, etag: result.etag || null, source: "studio" };
    },

    async archive(kindInput, recordId, { expectedEtag = null, fallback = null } = {}) {
      const kind = normalizeKind(kindInput);
      let existing = null;
      try {
        existing = await this.get(kind, recordId);
      } catch (error) {
        if (error.status !== 404 || !fallback) throw error;
      }
      const record = existing?.record || { ...fallback, id: cleanId(recordId) };
      return this.save(kind, { ...record, archived: true }, { expectedEtag: expectedEtag || existing?.etag || null });
    },

    async saveAsset(assetId, variant, bytes, metadata = {}) {
      const cleanAssetId = cleanId(assetId);
      const cleanVariant = variant === "thumb" ? "thumb" : "full";
      const result = await store.set(assetKey(cleanAssetId, cleanVariant), bytes, {
        onlyIfNew: true,
        metadata: { contentType: "image/webp", ...metadata },
      });
      if (!result.modified) throw new ContentStoreError("Could not store the image. Try again.", 409);
      return result.etag || null;
    },

    async getAsset(assetId, variant) {
      const entry = await store.getWithMetadata(assetKey(cleanId(assetId), variant === "thumb" ? "thumb" : "full"), {
        type: "arrayBuffer",
        consistency: "strong",
      });
      if (!entry?.data) throw new ContentStoreError("Image not found.", 404);
      return entry;
    },
  };
}

export class ContentStoreError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "ContentStoreError";
    this.status = status;
  }
}

export function normalizeKind(value) {
  const kind = String(value || "").trim().toLowerCase();
  if (!CONTENT_KINDS.has(kind)) throw new ContentStoreError("Content type is not supported.");
  return kind;
}

function normalizeRecord(kind, payload, context) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new ContentStoreError("Content entry must be an object.");
  }
  const base = {
    id: context.id,
    kind,
    created_at: context.createdAt,
    updated_at: context.updatedAt,
    archived: Boolean(payload.archived),
  };
  return kind === "photos" ? normalizePhoto(payload, base) : normalizeProject(payload, base);
}

function normalizePhoto(payload, base) {
  const title = requiredText(payload.title, "Photo title", 180);
  const date = normalizeDate(payload.date) || new Date().toISOString();
  const photo = optionalText(payload.photo, 1000);
  if (!photo && !payload.archived) throw new ContentStoreError("Choose a photo before publishing.");
  return {
    ...base,
    title,
    date,
    photo,
    photo_mobile: optionalText(payload.photo_mobile, 1000),
    is_mine: toBoolean(payload.is_mine, true),
    caption: optionalText(payload.caption, 500),
    location: optionalText(payload.location, 240),
    description: optionalText(payload.description, 2000),
    creator: optionalText(payload.creator, 240),
    source_url: optionalURL(payload.source_url),
    rights: optionalText(payload.rights, 500),
    source_slug: optionalText(payload.source_slug || payload.id, 200),
  };
}

function normalizeProject(payload, base) {
  return {
    ...base,
    title: requiredText(payload.title, "Project title", 180),
    status: oneOf(payload.status, ["Active", "Completed", "Archived"], "Active"),
    year: integerBetween(payload.year, 2000, 2100, new Date().getFullYear()),
    description: requiredText(payload.description, "Project description", 1200),
    technologies: normalizeList(payload.technologies, 30, 80),
    link: optionalURL(payload.link),
    github: optionalURL(payload.github),
    cover_image: optionalText(payload.cover_image, 1000),
    cover_image_mobile: optionalText(payload.cover_image_mobile, 1000),
    body: optionalText(payload.body, 30000),
    source_slug: optionalText(payload.source_slug || payload.id, 200),
  };
}

function makeRecordId(kind, payload) {
  const prefix = kind === "photos" ? normalizeDate(payload?.date)?.slice(0, 10) : "";
  const slug = slugify(payload?.title || kind);
  return [prefix, slug, randomUUID().slice(0, 8)].filter(Boolean).join("-");
}

function contentKey(kind, id) {
  return `content/${normalizeKind(kind)}/${encodeURIComponent(cleanId(id))}.json`;
}

function assetKey(assetId, variant) {
  return `assets/${encodeURIComponent(assetId)}/${variant}.webp`;
}

function cleanId(value) {
  const id = String(value || "").trim();
  if (!id || id.length > 220 || !/^[A-Za-z0-9._-]+$/.test(id)) throw new ContentStoreError("Content identifier is invalid.");
  return id;
}

function slugify(value) {
  const slug = String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
  return slug || "entry";
}

function requiredText(value, label, maxLength) {
  const text = optionalText(value, maxLength);
  if (!text) throw new ContentStoreError(`${label} is required.`);
  return text;
}

function optionalText(value, maxLength) {
  const text = String(value ?? "").trim();
  if (text.length > maxLength) throw new ContentStoreError(`One field is longer than the ${maxLength}-character limit.`);
  return text;
}

function normalizeList(value, maxItems, maxItemLength) {
  const values = Array.isArray(value) ? value : String(value || "").split(",");
  return [...new Set(values.map((item) => String(item).trim()).filter(Boolean))]
    .slice(0, maxItems)
    .map((item) => item.slice(0, maxItemLength));
}

function optionalURL(value) {
  const text = optionalText(value, 1000);
  if (!text) return "";
  let url;
  try {
    url = new URL(text);
  } catch {
    throw new ContentStoreError("Links must be complete http or https URLs.");
  }
  if (!new Set(["http:", "https:"]).has(url.protocol)) throw new ContentStoreError("Links must use http or https.");
  return url.toString();
}

function normalizeDate(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) throw new ContentStoreError("Date is not valid.");
  return date.toISOString();
}

function integerBetween(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isInteger(number)) return fallback;
  if (number < min || number > max) throw new ContentStoreError(`Year must be between ${min} and ${max}.`);
  return number;
}

function oneOf(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

function toBoolean(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  return !["false", "0", "no", "off"].includes(String(value).toLowerCase());
}

function sortTimestamp(record) {
  return String(record?.date || record?.updated_at || "");
}
