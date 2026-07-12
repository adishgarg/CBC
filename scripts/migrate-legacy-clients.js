/* eslint-disable no-console */
const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

const isDryRun = process.argv.includes("--dry-run");

function normalizeLegacyClient(client) {
  if (!client || typeof client !== "object") return null;

  const name = typeof client.name === "string" ? client.name.trim() : "";
  if (!name) return null;

  const normalized = { name };

  if (typeof client.email === "string" && client.email.trim()) {
    normalized.email = client.email.trim();
  }

  if (typeof client.phoneNumber === "string" && client.phoneNumber.trim()) {
    normalized.phoneNumber = client.phoneNumber.trim();
  }

  return normalized;
}

async function migrateLegacyClients() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI is not defined in .env.local");
  }

  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;
  const projectsCollection = db.collection("projects");

  const query = {
    "client.name": { $exists: true, $ne: null },
    $or: [
      { clients: { $exists: false } },
      { clients: null },
      { clients: { $size: 0 } },
    ],
  };

  const totalCandidates = await projectsCollection.countDocuments(query);

  console.log("Legacy client migration");
  console.log("----------------------------------------");
  console.log(`Mode: ${isDryRun ? "DRY RUN" : "MIGRATION"}`);
  console.log(`Projects matched: ${totalCandidates}`);

  if (totalCandidates === 0) {
    console.log("No projects need migration.");
    return;
  }

  const cursor = projectsCollection.find(query, {
    projection: { _id: 1, name: 1, client: 1, clients: 1 },
  });

  const ops = [];
  let skipped = 0;

  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    const normalizedClient = normalizeLegacyClient(doc.client);

    if (!normalizedClient) {
      skipped += 1;
      continue;
    }

    console.log(`- ${doc.name || doc._id}: ${normalizedClient.name}`);

    if (!isDryRun) {
      ops.push({
        updateOne: {
          filter: { _id: doc._id },
          update: {
            $set: {
              clients: [normalizedClient],
            },
          },
        },
      });
    }
  }

  if (isDryRun) {
    console.log("----------------------------------------");
    console.log(`Dry run complete. Skipped invalid legacy client entries: ${skipped}`);
    return;
  }

  if (ops.length === 0) {
    console.log("No valid legacy clients found to migrate.");
    return;
  }

  const result = await projectsCollection.bulkWrite(ops, { ordered: false });

  console.log("----------------------------------------");
  console.log(`Migrated projects: ${result.modifiedCount}`);
  console.log(`Skipped invalid legacy client entries: ${skipped}`);
}

migrateLegacyClients()
  .then(async () => {
    await mongoose.connection.close();
    console.log("Done.");
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Migration failed:", error);
    if (mongoose.connection.readyState) {
      await mongoose.connection.close();
    }
    process.exit(1);
  });
