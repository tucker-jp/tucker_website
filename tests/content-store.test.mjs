import assert from "node:assert/strict";
import test from "node:test";

import { ContentStoreError, createContentRepository } from "../netlify/lib/content-store.mjs";

test("photos preserve ownership metadata and use version-safe updates", async () => {
  const repository = createContentRepository(new MemoryStore());
  const created = await repository.save("photos", {
    title: "A Turner landscape",
    date: "2026-07-13T12:00:00Z",
    photo: "/api/content/assets/one/full",
    photo_mobile: "/api/content/assets/one/thumb",
    is_mine: false,
    creator: "J. M. W. Turner",
    rights: "Public domain",
  });
  assert.equal(created.record.is_mine, false);
  assert.equal(created.record.creator, "J. M. W. Turner");

  const updated = await repository.save("photos", { ...created.record, caption: "Landscape with Water" }, { expectedEtag: created.etag });
  assert.equal(updated.record.caption, "Landscape with Water");
  await assert.rejects(
    repository.save("photos", { ...created.record, caption: "Stale edit" }, { expectedEtag: created.etag }),
    ContentStoreError,
  );
});

test("a static photo can be hidden with a recoverable Studio tombstone", async () => {
  const repository = createContentRepository(new MemoryStore());
  const archived = await repository.archive("photos", "existing-static-photo", {
    fallback: {
      title: "Existing static photo",
      date: "2026-01-01",
      photo: "/uploads/existing.jpg",
      is_mine: true,
      source_slug: "existing-static-photo",
    },
  });
  assert.equal(archived.record.archived, true);
  assert.equal((await repository.list("photos", { includeArchived: false })).length, 0);
  assert.equal((await repository.list("photos", { includeArchived: true })).length, 1);
});

test("projects normalize technologies and assets are stored separately", async () => {
  const store = new MemoryStore();
  const repository = createContentRepository(store);
  const project = await repository.save("projects", {
    title: "Site Studio",
    status: "Active",
    year: 2026,
    description: "A private content editor.",
    technologies: "HTML, Netlify, HTML",
  });
  assert.deepEqual(project.record.technologies, ["HTML", "Netlify"]);

  const bytes = new Uint8Array([1, 2, 3]).buffer;
  await repository.saveAsset("asset-1", "thumb", bytes, { width: 1, height: 1 });
  const asset = await repository.getAsset("asset-1", "thumb");
  assert.deepEqual([...new Uint8Array(asset.data)], [1, 2, 3]);
});

class MemoryStore {
  constructor() {
    this.entries = new Map();
    this.version = 0;
  }

  async getWithMetadata(key) {
    const entry = this.entries.get(key);
    if (!entry) return null;
    const data = entry.data instanceof ArrayBuffer ? entry.data.slice(0) : structuredClone(entry.data);
    return { data, etag: entry.etag, metadata: structuredClone(entry.metadata || {}) };
  }

  async setJSON(key, data, options = {}) {
    return this.write(key, structuredClone(data), options);
  }

  async set(key, data, options = {}) {
    const value = data instanceof ArrayBuffer ? data.slice(0) : data;
    return this.write(key, value, options);
  }

  async write(key, data, options) {
    const existing = this.entries.get(key);
    if (options.onlyIfNew && existing) return { modified: false };
    if (options.onlyIfMatch && (!existing || existing.etag !== options.onlyIfMatch)) return { modified: false };
    const etag = `etag-${++this.version}`;
    this.entries.set(key, { data, etag, metadata: structuredClone(options.metadata || {}) });
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
