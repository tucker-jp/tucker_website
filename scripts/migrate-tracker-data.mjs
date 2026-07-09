import { readFile, readdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { getStore } from "@netlify/blobs";

import { normalizeRecord } from "../netlify/lib/tracker-schema.mjs";
import { createTrackerRepository, ConflictError, TRACKER_STORE_NAME } from "../netlify/lib/tracker-store.mjs";

const siteID = process.env.NETLIFY_SITE_ID;
const token = process.env.NETLIFY_AUTH_TOKEN;
const ownerID = process.env.TRACKER_OWNER_ID;
const dataRoot = path.resolve(process.env.TRACKER_DATA_ROOT || path.join(os.homedir(), "tracker-data"));
const replaceExisting = process.env.TRACKER_MIGRATION_REPLACE === "1";
const dryRun = process.env.TRACKER_MIGRATION_DRY_RUN === "1";

if (!dryRun && (!siteID || !token || !ownerID)) {
  throw new Error("Set NETLIFY_SITE_ID, NETLIFY_AUTH_TOKEN, and TRACKER_OWNER_ID before migrating Tracker data.");
}

const repository = dryRun
  ? null
  : createTrackerRepository(getStore({ name: TRACKER_STORE_NAME, siteID, token, consistency: "strong" }));
const categories = ["books", "movies", "restaurants", "ideas", "quotes"];
const result = { source_records: 0, validated: 0, imported: 0, updated: 0, skipped: 0, failed: 0 };

for (const category of categories) {
  const categoryDirectory = path.join(dataRoot, "records", category);
  const filenames = (await readdir(categoryDirectory)).filter((filename) => filename.endsWith(".json")).sort();
  for (const filename of filenames) {
    const payload = JSON.parse(await readFile(path.join(categoryDirectory, filename), "utf8"));
    result.source_records += 1;
    normalizeRecord(category, payload);
    result.validated += 1;
    if (dryRun) continue;
    try {
      await repository.saveItem(ownerID, category, payload);
      result.imported += 1;
    } catch (error) {
      if (!(error instanceof ConflictError)) {
        result.failed += 1;
        throw error;
      }
      if (!replaceExisting) {
        result.skipped += 1;
        continue;
      }
      const existing = await repository.getItem(ownerID, category, payload.id);
      await repository.saveItem(ownerID, category, payload, { expectedEtag: existing.etag });
      result.updated += 1;
    }
  }
}

const indexed = dryRun ? 0 : await repository.rebuildItemIndex(ownerID);
console.log(JSON.stringify({ mode: dryRun ? "dry-run" : "write", ...result, indexed, data_root: dataRoot }, null, 2));
