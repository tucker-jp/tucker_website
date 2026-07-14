import { randomUUID } from "node:crypto";

import { getUser } from "@netlify/identity";
import sharp from "sharp";

import {
  ContentStoreError,
  createContentRepository,
  normalizeKind,
} from "../lib/content-store.mjs";

const repository = createContentRepository();
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const MAX_MULTIPART_BYTES = 12 * 1024 * 1024;

export const config = {
  path: ["/api/content", "/api/content/*"],
  rateLimit: {
    windowLimit: 120,
    windowSize: 60,
    aggregateBy: ["ip", "domain"],
  },
};

export default async function contentFunction(request) {
  const route = routeSegments(request.url);

  try {
    if (request.method === "GET" && route[0] === "assets" && route.length === 3) {
      return await serveAsset(route[1], route[2], request);
    }
    if (request.method === "GET" && route[0] === "public" && route.length === 2) {
      const kind = normalizeKind(route[1]);
      const entries = await repository.list(kind, { includeArchived: true });
      return Response.json(
        { records: entries.map(({ record }) => publicRecord(record)) },
        { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=300" } },
      );
    }

    const user = await requireContentUser();
    if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) assertSameOrigin(request);

    if (request.method === "GET" && (route.length === 0 || route[0] === "bootstrap")) {
      const [photos, projects] = await Promise.all([
        repository.list("photos", { includeArchived: true }),
        repository.list("projects", { includeArchived: true }),
      ]);
      return jsonResponse({ user: publicUser(user), photos, projects });
    }

    if (request.method === "GET" && route[0] === "items" && route.length === 2) {
      return jsonResponse({ entries: await repository.list(route[1], { includeArchived: true }) });
    }

    if (["POST", "PUT"].includes(request.method) && route[0] === "items" && [2, 3].includes(route.length)) {
      const kind = normalizeKind(route[1]);
      const { record, image } = await readMultipartRecord(request);
      if (route[2]) record.id = route[2];
      const withImage = image ? await attachProcessedImage(kind, record, image) : record;
      const saved = await repository.save(kind, withImage, {
        expectedEtag: request.headers.get("if-match") || null,
      });
      return jsonResponse(saved, request.method === "POST" ? 201 : 200);
    }

    if (request.method === "DELETE" && route[0] === "items" && route.length === 3) {
      const body = await readJSON(request);
      const archived = await repository.archive(route[1], route[2], {
        expectedEtag: request.headers.get("if-match") || null,
        fallback: body.record || body,
      });
      return jsonResponse(archived);
    }

    if (request.method === "GET" && route[0] === "export") {
      const [photos, projects] = await Promise.all([
        repository.list("photos", { includeArchived: true }),
        repository.list("projects", { includeArchived: true }),
      ]);
      return jsonResponse({ exported_at: new Date().toISOString(), version: 1, photos, projects });
    }

    return jsonResponse({ error: "Route not found." }, 404);
  } catch (error) {
    const status = error instanceof ContentStoreError ? error.status : Number(error?.status) || 500;
    if (status >= 500) console.error(error);
    return jsonResponse({ error: status >= 500 ? "Site Studio could not complete that request." : error.message }, status);
  }
}

async function serveAsset(assetId, variant, request) {
  const entry = await repository.getAsset(assetId, variant);
  const ifNoneMatch = request.headers.get("if-none-match");
  if (ifNoneMatch && entry.etag && ifNoneMatch === entry.etag) {
    return new Response(null, { status: 304, headers: assetHeaders(entry.etag) });
  }
  return new Response(entry.data, { status: 200, headers: assetHeaders(entry.etag) });
}

function assetHeaders(etag) {
  return {
    "Content-Type": "image/webp",
    "Cache-Control": "public, max-age=31536000, immutable",
    ...(etag ? { ETag: etag } : {}),
    "X-Content-Type-Options": "nosniff",
  };
}

async function readMultipartRecord(request) {
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_MULTIPART_BYTES) throw new ContentStoreError("Upload is too large. Choose an image under 10 MB.", 413);
  let form;
  try {
    form = await request.formData();
  } catch {
    throw new ContentStoreError("Upload form could not be read.");
  }
  let record;
  try {
    record = JSON.parse(String(form.get("record") || "{}"));
  } catch {
    throw new ContentStoreError("Content details are not valid JSON.");
  }
  if (!record || typeof record !== "object" || Array.isArray(record)) {
    throw new ContentStoreError("Content details are invalid.");
  }
  const candidate = form.get("image");
  const image = candidate && typeof candidate.arrayBuffer === "function" && candidate.size > 0 ? candidate : null;
  if (image?.size > MAX_UPLOAD_BYTES) throw new ContentStoreError("Image must be smaller than 10 MB.", 413);
  return { record, image };
}

async function attachProcessedImage(kind, record, file) {
  let input = Buffer.from(await file.arrayBuffer());
  const fileName = String(file.name || "").toLowerCase();
  const mimeType = String(file.type || "").toLowerCase();
  const isHEIC = /hei[cf]/.test(mimeType) || /\.(heic|heif)$/.test(fileName);
  if (isHEIC) {
    const imported = await import("heic-convert");
    const convert = imported.default || imported;
    try {
      input = Buffer.from(await convert({ buffer: input, format: "JPEG", quality: 0.92 }));
    } catch {
      throw new ContentStoreError("This HEIC image could not be converted. Try exporting it from Photos as JPEG.", 415);
    }
  }

  let full;
  let thumb;
  let metadata;
  try {
    const source = sharp(input, { failOn: "error" }).rotate();
    metadata = await source.metadata();
    [full, thumb] = await Promise.all([
      source.clone().resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true }).webp({ quality: 82, effort: 4 }).toBuffer(),
      source.clone().resize({ width: 900, height: 900, fit: "inside", withoutEnlargement: true }).webp({ quality: 76, effort: 4 }).toBuffer(),
    ]);
  } catch {
    throw new ContentStoreError("The selected file is not a supported image.", 415);
  }

  const assetId = randomUUID();
  await Promise.all([
    repository.saveAsset(assetId, "full", full, { width: metadata.width || null, height: metadata.height || null }),
    repository.saveAsset(assetId, "thumb", thumb, { width: metadata.width || null, height: metadata.height || null }),
  ]);
  const base = `/api/content/assets/${assetId}`;
  if (kind === "photos") return { ...record, photo: `${base}/full`, photo_mobile: `${base}/thumb` };
  return { ...record, cover_image: `${base}/full`, cover_image_mobile: `${base}/thumb` };
}

async function requireContentUser() {
  const user = await getUser();
  if (!user) throw new ContentStoreError("Sign in to open Site Studio.", 401);
  const allowlist = String(process.env.TRACKER_ALLOWED_USER_IDS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (allowlist.length && !allowlist.includes(user.id)) throw new ContentStoreError("This account does not have Site Studio access.", 403);
  return user;
}

function assertSameOrigin(request) {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");
  if (!origin || origin !== requestUrl.origin) throw new ContentStoreError("Request origin was not accepted.", 403);
}

async function readJSON(request) {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
    return body;
  } catch {
    throw new ContentStoreError("Request body must be valid JSON.");
  }
}

function publicRecord(record) {
  if (record.archived) {
    return { id: record.id, source_slug: record.source_slug || record.id, archived: true };
  }
  const { created_at, updated_at, ...publicFields } = record;
  return publicFields;
}

function routeSegments(url) {
  const segments = new URL(url).pathname.split("/").filter(Boolean);
  const index = segments.lastIndexOf("content");
  return index >= 0 ? segments.slice(index + 1).map(decodeURIComponent) : [];
}

function publicUser(user) {
  return { id: user.id, email: user.email, name: user.name || user.email };
}

function jsonResponse(data, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}
