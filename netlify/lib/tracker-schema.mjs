import { randomUUID } from "node:crypto";

export const CATEGORY_DEFS = {
  clips: {
    label: "Clips",
    type: "clip",
    primaryField: "title",
    statusField: "status",
    statusOptions: ["inbox", "reading", "kept", "done"],
    fields: [
      { name: "title", label: "Title", kind: "text", required: true },
      { name: "url", label: "URL", kind: "url" },
      { name: "excerpt", label: "Selected text", kind: "textarea" },
      { name: "status", label: "Status", kind: "select", options: ["inbox", "reading", "kept", "done"] },
      { name: "tags", label: "Tags", kind: "tags" },
      { name: "notes", label: "Notes", kind: "textarea" },
    ],
  },
  todos: {
    label: "To-dos",
    type: "todo",
    primaryField: "title",
    statusField: "status",
    statusOptions: ["open", "doing", "done"],
    fields: [
      { name: "title", label: "Title", kind: "text", required: true },
      { name: "body", label: "Details", kind: "textarea" },
      { name: "status", label: "Status", kind: "select", options: ["open", "doing", "done"] },
      { name: "due_on", label: "Due date", kind: "date" },
      { name: "tags", label: "Tags", kind: "tags" },
      { name: "notes", label: "Notes", kind: "textarea" },
    ],
  },
  books: {
    label: "Books",
    type: "book",
    primaryField: "title",
    statusField: "status",
    statusOptions: ["want", "reading", "read"],
    fields: [
      { name: "title", label: "Title", kind: "text", required: true },
      { name: "author", label: "Author", kind: "text" },
      { name: "status", label: "Status", kind: "select", options: ["want", "reading", "read"] },
      { name: "rating", label: "Rating", kind: "number", min: 1, max: 5 },
      { name: "tags", label: "Tags", kind: "tags" },
      { name: "notes", label: "Notes", kind: "textarea" },
      { name: "started_on", label: "Started", kind: "date" },
      { name: "finished_on", label: "Finished", kind: "date" },
    ],
  },
  movies: {
    label: "Movies",
    type: "movie",
    primaryField: "title",
    statusField: "status",
    statusOptions: ["want", "watched"],
    fields: [
      { name: "title", label: "Title", kind: "text", required: true },
      { name: "director", label: "Director", kind: "text" },
      { name: "year", label: "Year", kind: "number", min: 1800, max: 2200 },
      { name: "status", label: "Status", kind: "select", options: ["want", "watched"] },
      { name: "rating", label: "Rating", kind: "number", min: 1, max: 5 },
      { name: "tags", label: "Tags", kind: "tags" },
      { name: "notes", label: "Notes", kind: "textarea" },
      { name: "watched_on", label: "Watched", kind: "date" },
    ],
  },
  restaurants: {
    label: "Restaurants",
    type: "restaurant",
    primaryField: "name",
    statusField: "status",
    statusOptions: ["want", "visited"],
    fields: [
      { name: "name", label: "Name", kind: "text", required: true },
      { name: "location", label: "Location", kind: "text" },
      { name: "cuisine", label: "Cuisine", kind: "text" },
      { name: "status", label: "Status", kind: "select", options: ["want", "visited"] },
      { name: "rating", label: "Rating", kind: "number", min: 1, max: 5 },
      { name: "tags", label: "Tags", kind: "tags" },
      { name: "notes", label: "Notes", kind: "textarea" },
      { name: "visited_on", label: "Visited", kind: "date" },
    ],
  },
  ideas: {
    label: "Ideas",
    type: "idea",
    primaryField: "title",
    statusField: "status",
    statusOptions: ["open", "parked", "done"],
    fields: [
      { name: "title", label: "Title", kind: "text", required: true },
      { name: "body", label: "Body", kind: "textarea" },
      { name: "status", label: "Status", kind: "select", options: ["open", "parked", "done"] },
      { name: "tags", label: "Tags", kind: "tags" },
      { name: "notes", label: "Notes", kind: "textarea" },
    ],
  },
  quotes: {
    label: "Quotes",
    type: "quote",
    primaryField: "quote",
    statusField: null,
    statusOptions: [],
    fields: [
      { name: "quote", label: "Quote", kind: "textarea", required: true },
      { name: "speaker", label: "Speaker", kind: "text" },
      { name: "source", label: "Source", kind: "text" },
      { name: "tags", label: "Tags", kind: "tags" },
      { name: "notes", label: "Notes", kind: "textarea" },
    ],
  },
};

const TYPE_TO_CATEGORY = Object.fromEntries(
  Object.entries(CATEGORY_DEFS).map(([category, definition]) => [definition.type, category]),
);

export function categorySchema() {
  return Object.entries(CATEGORY_DEFS).map(([key, definition]) => ({ key, ...definition }));
}

export function normalizeCategory(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (CATEGORY_DEFS[normalized]) return normalized;
  if (TYPE_TO_CATEGORY[normalized]) return TYPE_TO_CATEGORY[normalized];
  throw new ValidationError(`Unknown category: ${value || "(missing)"}`);
}

export function normalizeRecord(categoryInput, payload, { existing = null, now = new Date(), id = null } = {}) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new ValidationError("Record data must be an object.");
  }

  const category = normalizeCategory(categoryInput);
  const definition = CATEGORY_DEFS[category];
  const normalized = {
    id: String(existing?.id || payload.id || id || randomUUID()),
    type: definition.type,
    created_at: normalizeTimestamp(existing?.created_at || payload.created_at) || now.toISOString(),
    updated_at: now.toISOString(),
    archived: Boolean(existing?.archived || payload.archived),
  };

  for (const field of definition.fields) {
    const value = normalizeField(field, payload[field.name]);
    if (value !== undefined) normalized[field.name] = value;
  }

  const primaryValue = normalized[definition.primaryField];
  if (!primaryValue) {
    throw new ValidationError(`${definition.label} requires ${definition.primaryField.replaceAll("_", " ")}.`);
  }

  if (existing && recordSignature(existing) === recordSignature(normalized)) {
    normalized.updated_at = existing.updated_at || normalized.created_at;
  }

  return { category, record: normalized };
}

export function captureToRecord(payload, options = {}) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new ValidationError("Capture data must be an object.");
  }

  const category = normalizeCategory(payload.category || payload.type || inferCaptureCategory(payload));
  const definition = CATEGORY_DEFS[category];
  const recordPayload = { ...payload };

  if (!recordPayload[definition.primaryField]) {
    recordPayload[definition.primaryField] = cleanText(payload.main_text || payload.title || payload.name);
  }

  const secondaryFields = {
    books: "author",
    movies: "director",
    restaurants: "location",
    ideas: "body",
    quotes: "speaker",
    clips: "excerpt",
    todos: "body",
  };
  const secondaryField = secondaryFields[category];
  if (secondaryField && !recordPayload[secondaryField]) {
    recordPayload[secondaryField] = cleanText(payload.secondary_text || payload.selected_text);
  }

  if (category === "clips") {
    recordPayload.url = cleanText(payload.url || payload.source_url);
    recordPayload.status ||= "inbox";
    recordPayload.title ||= recordPayload.url || "Untitled clip";
  }
  if (category === "todos") recordPayload.status ||= "open";
  if (["books", "movies", "restaurants"].includes(category)) recordPayload.status ||= "want";
  if (category === "ideas") recordPayload.status ||= "open";
  recordPayload.created_at ||= payload.captured_at;

  return normalizeRecord(category, recordPayload, options);
}

export function recordSummary(categoryInput, record, etag = null) {
  const category = normalizeCategory(categoryInput);
  const definition = CATEGORY_DEFS[category];
  return {
    category,
    etag,
    record,
    title: String(record[definition.primaryField] || "Untitled"),
    subtitle: subtitleFor(category, record),
  };
}

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
    this.status = 400;
  }
}

function inferCaptureCategory(payload) {
  if (payload.url || payload.source_url) return "clips";
  return "ideas";
}

function normalizeField(field, rawValue) {
  if (field.kind === "tags") {
    if (rawValue === undefined || rawValue === null || rawValue === "") return undefined;
    const values = Array.isArray(rawValue) ? rawValue : String(rawValue).split(",");
    const tags = [...new Set(values.map((value) => cleanText(value)).filter(Boolean))];
    return tags.length ? tags : undefined;
  }

  if (field.kind === "number") {
    if (rawValue === undefined || rawValue === null || rawValue === "") return undefined;
    const value = Number(rawValue);
    if (!Number.isInteger(value)) throw new ValidationError(`${field.label} must be a whole number.`);
    if (field.min !== undefined && value < field.min) throw new ValidationError(`${field.label} must be at least ${field.min}.`);
    if (field.max !== undefined && value > field.max) throw new ValidationError(`${field.label} must be at most ${field.max}.`);
    return value;
  }

  const value = cleanText(rawValue);
  if (!value) return undefined;

  if (field.kind === "select" && field.options && !field.options.includes(value)) {
    throw new ValidationError(`${field.label} must be one of: ${field.options.join(", ")}.`);
  }
  if (field.kind === "date" && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ValidationError(`${field.label} must be YYYY-MM-DD.`);
  }
  if (field.kind === "url") {
    try {
      const url = new URL(value);
      if (!["http:", "https:"].includes(url.protocol)) throw new Error("Unsupported protocol");
      return url.toString();
    } catch {
      throw new ValidationError(`${field.label} must be a valid web address.`);
    }
  }
  return value;
}

function normalizeTimestamp(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function cleanText(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function recordSignature(record) {
  const comparable = { ...record };
  delete comparable.updated_at;
  return JSON.stringify(comparable);
}

function subtitleFor(category, record) {
  if (category === "clips") return record.url || record.status || "";
  if (category === "todos") return record.status || record.due_on || "";
  if (category === "books") return record.author || record.status || "";
  if (category === "movies") return record.director || record.year || "";
  if (category === "restaurants") return record.location || record.cuisine || "";
  if (category === "ideas") return record.status || "";
  if (category === "quotes") return record.speaker || record.source || "";
  return "";
}
