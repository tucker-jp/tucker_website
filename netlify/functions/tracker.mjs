import { getUser } from "@netlify/identity";

import { categorySchema, ValidationError } from "../lib/tracker-schema.mjs";
import { createTrackerRepository, TrackerStoreError } from "../lib/tracker-store.mjs";

const repository = createTrackerRepository();
const MAX_JSON_BYTES = 256 * 1024;

export const config = {
  path: ["/api/tracker", "/api/tracker/*"],
  rateLimit: {
    windowLimit: 120,
    windowSize: 60,
    aggregateBy: ["ip", "domain"],
  },
};

export default async function trackerFunction(request) {
  const route = routeSegments(request.url);

  if (request.method === "OPTIONS" && route[0] === "capture") {
    return new Response(null, { status: 204, headers: captureCorsHeaders(request) });
  }

  try {
    if (route[0] === "capture") return handleCapture(request);

    const user = await requireTrackerUser();
    if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) assertSameOrigin(request);

    if (request.method === "GET" && (route.length === 0 || route[0] === "bootstrap")) {
      const [items, devices] = await Promise.all([
        repository.listItems(user.id),
        repository.listDevices(user.id),
      ]);
      return jsonResponse({ user: publicUser(user), schema: categorySchema(), items, devices });
    }

    if (request.method === "GET" && route[0] === "schema") {
      return jsonResponse({ schema: categorySchema() });
    }

    if (request.method === "GET" && route[0] === "items" && route.length === 1) {
      return jsonResponse({ items: await repository.listItems(user.id) });
    }

    if (request.method === "POST" && route[0] === "items" && route.length === 1) {
      const body = await readJSON(request);
      const saved = await repository.saveItem(user.id, body.category, body.record || body);
      return jsonResponse(saved, 201);
    }

    if (route[0] === "items" && route.length === 3) {
      const [, category, recordId] = route;
      if (request.method === "GET") {
        return jsonResponse(await repository.getItem(user.id, category, recordId));
      }
      if (request.method === "PUT") {
        const body = await readJSON(request);
        const saved = await repository.saveItem(
          user.id,
          category,
          { ...(body.record || body), id: recordId },
          { expectedEtag: request.headers.get("if-match") || body.etag || null },
        );
        return jsonResponse(saved);
      }
      if (request.method === "DELETE") {
        const archived = await repository.archiveItem(user.id, category, recordId, {
          expectedEtag: request.headers.get("if-match"),
        });
        return jsonResponse(archived);
      }
    }

    if (request.method === "GET" && route[0] === "devices" && route.length === 1) {
      return jsonResponse({ devices: await repository.listDevices(user.id) });
    }

    if (request.method === "POST" && route[0] === "devices" && route.length === 1) {
      const body = await readJSON(request);
      return jsonResponse(await repository.createDeviceToken(user.id, body.name), 201);
    }

    if (request.method === "DELETE" && route[0] === "devices" && route.length === 2) {
      return jsonResponse({ device: await repository.revokeDeviceToken(user.id, route[1]) });
    }

    if (request.method === "GET" && route[0] === "export") {
      const items = await repository.listItems(user.id, { includeArchived: true });
      return jsonResponse({ exported_at: new Date().toISOString(), version: 1, items });
    }

    if (request.method === "POST" && route[0] === "repair-index") {
      return jsonResponse({ rebuilt: await repository.rebuildItemIndex(user.id) });
    }

    return jsonResponse({ error: "Route not found." }, 404);
  } catch (error) {
    const status = error instanceof ValidationError || error instanceof TrackerStoreError
      ? error.status
      : Number(error?.status) || 500;
    const message = status >= 500 ? "Tracker could not complete that request." : error.message;
    if (status >= 500) console.error(error);
    return jsonResponse({ error: message }, status);
  }
}

async function handleCapture(request) {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405, captureCorsHeaders(request));
  }
  try {
    const authorization = request.headers.get("authorization") || "";
    const token = authorization.replace(/^Bearer\s+/i, "").trim();
    const payload = await readJSON(request);
    const saved = await repository.capture(token, payload);
    return jsonResponse(
      { ok: true, id: saved.record.id, category: saved.category, captured_at: saved.record.created_at },
      201,
      captureCorsHeaders(request),
    );
  } catch (error) {
    const status = Number(error?.status) || 500;
    if (status >= 500) console.error(error);
    return jsonResponse(
      { ok: false, error: status >= 500 ? "Capture failed." : error.message },
      status,
      captureCorsHeaders(request),
    );
  }
}

async function requireTrackerUser() {
  const user = await getUser();
  if (!user) throw new TrackerStoreError("Sign in to open Tracker.", 401);

  const allowlist = String(process.env.TRACKER_ALLOWED_USER_IDS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (allowlist.length && !allowlist.includes(user.id)) {
    throw new TrackerStoreError("This account does not have Tracker access.", 403);
  }
  return user;
}

function assertSameOrigin(request) {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");
  if (!origin || origin !== requestUrl.origin) {
    throw new TrackerStoreError("Request origin was not accepted.", 403);
  }
}

async function readJSON(request) {
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_JSON_BYTES) throw new TrackerStoreError("Request is too large.", 413);
  let body;
  try {
    body = await request.json();
  } catch {
    throw new TrackerStoreError("Request body must be valid JSON.", 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new TrackerStoreError("Request body must be a JSON object.", 400);
  }
  return body;
}

function routeSegments(url) {
  const segments = new URL(url).pathname.split("/").filter(Boolean);
  const trackerIndex = segments.lastIndexOf("tracker");
  return trackerIndex >= 0 ? segments.slice(trackerIndex + 1).map(decodeURIComponent) : [];
}

function publicUser(user) {
  return { id: user.id, email: user.email, name: user.name || user.email };
}

function jsonResponse(data, status = 200, extraHeaders = {}) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...extraHeaders,
    },
  });
}

function captureCorsHeaders(request) {
  return {
    "Access-Control-Allow-Origin": request.headers.get("origin") || "*",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}
