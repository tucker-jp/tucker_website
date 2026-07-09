import assert from "node:assert/strict";
import test from "node:test";

import {
  captureToRecord,
  categorySchema,
  normalizeRecord,
  ValidationError,
} from "../netlify/lib/tracker-schema.mjs";

test("the web schema contains the existing categories plus clips and to-dos", () => {
  assert.deepEqual(categorySchema().map((category) => category.key), [
    "clips", "todos", "books", "movies", "restaurants", "ideas", "quotes",
  ]);
});

test("existing Tracker JSON remains migration compatible", () => {
  const existing = {
    id: "book-1",
    type: "book",
    title: "The Dispossessed",
    author: "Ursula K. Le Guin",
    status: "read",
    rating: 5,
    tags: ["fiction", "politics"],
    created_at: "2026-04-01T12:00:00Z",
    updated_at: "2026-04-02T12:00:00Z",
    archived: false,
  };
  const { category, record } = normalizeRecord("books", existing, { now: new Date("2026-07-09T12:00:00Z") });
  assert.equal(category, "books");
  assert.equal(record.id, existing.id);
  assert.equal(record.title, existing.title);
  assert.equal(record.author, existing.author);
  assert.equal(record.created_at, "2026-04-01T12:00:00.000Z");
});

test("a shared URL becomes a clip with the selected text and capture timestamp", () => {
  const { category, record } = captureToRecord({
    url: "https://example.com/story",
    title: "Example story",
    selected_text: "The part worth keeping.",
    captured_at: "2026-07-09T14:30:00-04:00",
  });
  assert.equal(category, "clips");
  assert.equal(record.url, "https://example.com/story");
  assert.equal(record.excerpt, "The part worth keeping.");
  assert.equal(record.status, "inbox");
  assert.equal(record.created_at, "2026-07-09T18:30:00.000Z");
});

test("required fields and URLs are validated", () => {
  assert.throws(() => normalizeRecord("quotes", { speaker: "Nobody" }), ValidationError);
  assert.throws(() => normalizeRecord("clips", { title: "Bad link", url: "file:///private/file" }), /valid web address/);
});
