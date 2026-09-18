#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const process = require("node:process");
const { parseArgs } = require("node:util");
const admin = require("firebase-admin");

const options = parseArgs({
  options: {
    project: { type: "string" },
    out: { type: "string", default: "./migration-dump" },
    credentials: { type: "string" },
  },
}).values;

if (!options.project) {
  throw new Error("Usage: firestore-export.cjs --project=<source-project> [--out=./migration-dump]");
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
  return admin.initializeApp(appOptions, `migration-export-${options.project}`);
}

function serialize(value) {
  if (value === null || value === undefined) return value;
  if (value instanceof admin.firestore.Timestamp) {
    return { __type: "timestamp", seconds: value.seconds, nanoseconds: value.nanoseconds };
  }
  if (value instanceof admin.firestore.GeoPoint) {
    return { __type: "geoPoint", latitude: value.latitude, longitude: value.longitude };
  }
  if (Buffer.isBuffer(value)) {
    return { __type: "bytes", base64: value.toString("base64") };
  }
  if (value instanceof admin.firestore.DocumentReference) {
    return {
      __type: "reference",
      projectId: value.firestore.projectId,
      databaseId: value.firestore._settings?.databaseId || "(default)",
      path: value.path,
    };
  }
  if (Array.isArray(value)) return value.map(serialize);
  if (typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, serialize(item)]));
  }
  return value;
}

async function main() {
  const app = createApp();
  const db = admin.firestore(app);
  const outputDir = path.resolve(options.out);
  fs.mkdirSync(outputDir, { recursive: true });
  const documentsFile = path.join(outputDir, "documents.ndjson");
  const stream = fs.createWriteStream(documentsFile, { encoding: "utf8" });
  let documentCount = 0;
  let collectionCount = 0;

  async function exportCollection(collectionRef) {
    collectionCount += 1;
    const snapshot = await collectionRef.get();
    for (const document of snapshot.docs) {
      stream.write(`${JSON.stringify({
        path: document.ref.path,
        data: serialize(document.data()),
      })}\n`);
      documentCount += 1;
      const subcollections = await document.ref.listCollections();
      for (const subcollection of subcollections) {
        await exportCollection(subcollection);
      }
    }
  }

  try {
    const collections = await db.listCollections();
    for (const collection of collections) await exportCollection(collection);
    await new Promise((resolve, reject) => {
      stream.once("error", reject);
      stream.end(resolve);
    });
    fs.writeFileSync(
      path.join(outputDir, "manifest.json"),
      `${JSON.stringify({
        formatVersion: 1,
        sourceProject: options.project,
        databaseId: db._settings?.databaseId || "(default)",
        documentCount,
        collectionCount,
        documentsFile: "documents.ndjson",
      }, null, 2)}\n`,
    );
    console.log(`Exported ${documentCount} documents across ${collectionCount} collections to ${outputDir}`);
  } finally {
    await app.delete();
  }
}

main().catch((error) => {
  console.error("Firestore export failed:", error);
  process.exitCode = 1;
});
