import assert from "node:assert/strict";
import test from "node:test";

import { ConflictError, createTrackerRepository } from "../netlify/lib/tracker-store.mjs";

test("records are independently versioned, listed, updated, and softly archived", async () => {
  const repository = createTrackerRepository(new MemoryStore());
  const created = await repository.saveItem("owner-1", "books", { title: "Piranesi", author: "Susanna Clarke", status: "want" });
  assert.ok(created.etag);
  assert.equal((await repository.listItems("owner-1")).length, 1);

  const updated = await repository.saveItem(
    "owner-1",
    "books",
    { ...created.record, status: "read", rating: 5 },
    { expectedEtag: created.etag },
  );
  assert.equal(updated.record.status, "read");
  assert.equal((await repository.listItems("owner-1"))[0].record.rating, 5);

  await assert.rejects(
    repository.saveItem("owner-1", "books", { ...created.record, status: "reading" }, { expectedEtag: created.etag }),
    ConflictError,
  );

  await repository.archiveItem("owner-1", "books", created.record.id, { expectedEtag: updated.etag });
  assert.equal((await repository.listItems("owner-1")).length, 0);
  assert.equal((await repository.listItems("owner-1", { includeArchived: true })).length, 1);
});

test("a device token can capture but is not stored in plaintext", async () => {
  const store = new MemoryStore();
  const repository = createTrackerRepository(store);
  const { device, token } = await repository.createDeviceToken("owner-2", "Test iPhone");
  assert.match(token, /^tkt\./);

  const captured = await repository.capture(token, {
    category: "quotes",
    main_text: "A test quote",
    secondary_text: "Test speaker",
    captured_at: "2026-07-09T12:00:00Z",
  });
  assert.equal(captured.record.quote, "A test quote");
  assert.equal((await repository.listItems("owner-2")).length, 1);

  const storedToken = [...store.entries.values()].find((entry) => entry.data?.id === device.id)?.data;
  assert.ok(storedToken.secret_hash);
  assert.equal(JSON.stringify(storedToken).includes(token), false);

  await repository.revokeDeviceToken("owner-2", device.id);
  await assert.rejects(repository.capture(token, { category: "ideas", main_text: "Should fail" }), /not active/);
});

class MemoryStore {
  constructor() {
    this.entries = new Map();
    this.version = 0;
  }

  async getWithMetadata(key) {
    const entry = this.entries.get(key);
    if (!entry) return null;
    return { data: structuredClone(entry.data), etag: entry.etag, metadata: structuredClone(entry.metadata || {}) };
  }

  async setJSON(key, data, options = {}) {
    const existing = this.entries.get(key);
    if (options.onlyIfNew && existing) return { modified: false };
    if (options.onlyIfMatch && (!existing || existing.etag !== options.onlyIfMatch)) return { modified: false };
    const etag = `etag-${++this.version}`;
    this.entries.set(key, { data: structuredClone(data), etag, metadata: structuredClone(options.metadata || {}) });
    return { modified: true, etag };
  }

  async list({ prefix = "" } = {}) {
    return {
      blobs: [...this.entries.entries()]
        .filter(([key]) => key.startsWith(prefix))
        .map(([key, entry]) => ({ key, etag: entry.etag })),
      directories: [],
    };
  }
}
