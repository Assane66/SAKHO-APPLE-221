#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const process = require("node:process");
const { parseArgs } = require("node:util");
const admin = require("firebase-admin");
const { Firestore } = require("@google-cloud/firestore");

const options = parseArgs({
  options: {
    project: { type: "string" },
    sourceProject: { type: "string" },
    in: { type: "string", default: "./migration-dump" },
    credentials: { type: "string" },
    "allow-non-empty": { type: "boolean", default: false },
  },
}).values;

if (!options.project || !options.sourceProject) {
  throw new Error("Usage: firestore-import.cjs --sourceProject=<source> --project=<target> [--in=./migration-dump]");
}
if (options.project === options.sourceProject) {
  throw new Error("Refusing to import: target project must differ from source project.");
}

function createApp() {
  const appOptions = { projectId: options.project };
  if (options.credentials) {
    const credentialsPath = path.resolve(options.credentials);
    if (!fs.existsSync(credentialsPath)) {
      throw new Error(`Credentials file not found: ${credentialsPath}`);
    }
    appOptions.credential = admin.credential.cert(JSON.parse(fs.readFileSync(credentialsPath, "utf8")));
  } else {
    const adcPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
      || path.join(process.env.HOME || "", ".config", "gcloud", "application_default_credentials.json");
    if (!fs.existsSync(adcPath)) {
      console.error(
        "No Google credentials found. Run `gcloud auth application-default login` or pass --credentials=/path/to/service-account.json.",
      );
    }
    appOptions.credential = admin.credential.applicationDefault();
  }
  return admin.initializeApp(appOptions, `migration-import-${options.project}`);
}

function deserialize(value, db) {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map((item) => deserialize(item, db));
  if (typeof value !== "object") return value;

  switch (value.__type) {
    case "timestamp":
      return new admin.firestore.Timestamp(value.seconds, value.nanoseconds);
    case "geoPoint":
      return new admin.firestore.GeoPoint(value.latitude, value.longitude);
    case "bytes":
      return Buffer.from(value.base64, "base64");
    case "reference":
      if (value.projectId === options.sourceProject || !value.projectId) {
        return db.doc(value.path);
      }
      // References to another project are retained instead of being silently
      // redirected to the migration target.
      return new Firestore({
        projectId: value.projectId,
        databaseId: value.databaseId || "(default)",
      }).doc(value.path);
    default:
      return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [key, deserialize(item, db)]),
      );
  }
}

async function main() {
  const inputDir = path.resolve(options.in);
  const manifest = JSON.parse(fs.readFileSync(path.join(inputDir, "manifest.json"), "utf8"));
  if (manifest.sourceProject !== options.sourceProject) {
    throw new Error(`Dump belongs to ${manifest.sourceProject}, not ${options.sourceProject}.`);
  }

  const app = createApp();
  const db = admin.firestore(app);
  try {
    if (!options["allow-non-empty"]) {
      const existing = await db.listCollections();
      if (existing.length > 0) {
        throw new Error(
          `Target ${options.project} is not empty. Re-run with --allow-non-empty only after reviewing overwrite behavior.`,
        );
      }
    }

    const lines = fs.readFileSync(path.join(inputDir, manifest.documentsFile), "utf8")
      .split("\n")
      .filter(Boolean);
    let batch = db.batch();
    let batchSize = 0;
    let imported = 0;
    for (const line of lines) {
      const record = JSON.parse(line);
      const document = db.doc(record.path);
      batch.set(document, deserialize(record.data, db), { merge: false });
      batchSize += 1;
      imported += 1;
      if (batchSize === 400) {
        await batch.commit();
        batch = db.batch();
        batchSize = 0;
        console.log(`Imported ${imported}/${lines.length} documents`);
      }
    }
    if (batchSize > 0) await batch.commit();
    console.log(`Imported ${imported} documents into ${options.project}`);
  } finally {
    await app.delete();
  }
}

main().catch((error) => {
  console.error("Firestore import failed:", error);
  process.exitCode = 1;
});
