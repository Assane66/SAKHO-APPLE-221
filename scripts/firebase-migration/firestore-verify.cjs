#!/usr/bin/env node

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { parseArgs } = require("node:util");
const admin = require("firebase-admin");

const options = parseArgs({
  options: {
    sourceProject: { type: "string" },
    targetProject: { type: "string" },
    dump: { type: "string", default: "./migration-dump" },
  },
}).values;

if (!options.sourceProject || !options.targetProject) {
  throw new Error("Usage: firestore-verify.cjs --sourceProject=<source> --targetProject=<target> [--dump=./migration-dump]");
}

function fingerprint(data) {
  return crypto.createHash("sha256").update(JSON.stringify(normalize(data))).digest("hex");
}

function normalize(value) {
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
    return { __type: "reference", path: value.path };
  }
  if (Array.isArray(value)) return value.map(normalize);
  if (typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalize(item)]));
  }
  return value;
}

async function snapshotDatabase(db) {
  const result = new Map();
  async function visit(collection) {
    for (const document of (await collection.get()).docs) {
      result.set(document.ref.path, fingerprint(document.data()));
      for (const subcollection of await document.ref.listCollections()) await visit(subcollection);
    }
  }
  for (const collection of await db.listCollections()) await visit(collection);
  return result;
}

async function main() {
  const sourceApp = admin.initializeApp(
    { projectId: options.sourceProject, credential: admin.credential.applicationDefault() },
    "verify-source",
  );
  const targetApp = admin.initializeApp(
    { projectId: options.targetProject, credential: admin.credential.applicationDefault() },
    "verify-target",
  );
  try {
    const [source, target] = await Promise.all([
      snapshotDatabase(admin.firestore(sourceApp)),
      snapshotDatabase(admin.firestore(targetApp)),
    ]);
    const missing = [...source.keys()].filter((documentPath) => !target.has(documentPath));
    const extra = [...target.keys()].filter((documentPath) => !source.has(documentPath));
    const different = [...source.keys()].filter(
      (documentPath) => target.has(documentPath) && source.get(documentPath) !== target.get(documentPath),
    );
    const report = {
      sourceProject: options.sourceProject,
      targetProject: options.targetProject,
      sourceDocuments: source.size,
      targetDocuments: target.size,
      missing,
      extra,
      different,
      verified: missing.length === 0 && extra.length === 0 && different.length === 0,
    };
    fs.writeFileSync(
      path.join(path.resolve(options.dump), "verification.json"),
      `${JSON.stringify(report, null, 2)}\n`,
    );
    console.log(JSON.stringify(report, null, 2));
    if (!report.verified) process.exitCode = 2;
  } finally {
    await Promise.all([sourceApp.delete(), targetApp.delete()]);
  }
}

main().catch((error) => {
  console.error("Firestore verification failed:", error);
  process.exitCode = 1;
});
