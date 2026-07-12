/* eslint-disable no-console */
const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

const isDryRun = process.argv.includes("--dry-run");

async function migrateProjectIds() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI is not defined in .env.local");
  }

  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;
  const projects = db.collection("projects");
  const counters = db.collection("projectcounters");

  const query = {
    $or: [{ projectId: { $exists: false } }, { projectId: null }],
  };

  const docsToMigrate = await projects
    .find(query, { projection: { _id: 1, name: 1, createdAt: 1 } })
    .sort({ createdAt: 1, _id: 1 })
    .toArray();

  console.log("Project ID migration");
  console.log("----------------------------------------");
  console.log(`Mode: ${isDryRun ? "DRY RUN" : "MIGRATION"}`);
  console.log(`Projects missing projectId: ${docsToMigrate.length}`);

  if (docsToMigrate.length === 0) {
    console.log("No projects need backfill.");
    return;
  }

  const counterDoc = await counters.findOne({});
  const maxProject = await projects
    .find({ projectId: { $type: "number" } }, { projection: { projectId: 1 } })
    .sort({ projectId: -1 })
    .limit(1)
    .toArray();

  const maxExistingProjectId = maxProject[0]?.projectId || 0;
  const counterNext = counterDoc?.nextNumber || 164;
  const startProjectId = Math.max(counterNext, maxExistingProjectId + 1, 164);

  console.log(`Counter nextNumber: ${counterNext}`);
  console.log(`Max existing projectId: ${maxExistingProjectId}`);
  console.log(`Backfill starting at: ${startProjectId}`);

  docsToMigrate.forEach((doc, index) => {
    console.log(`- ${startProjectId + index}: ${doc.name || doc._id.toString()}`);
  });

  if (isDryRun) {
    console.log("----------------------------------------");
    console.log("Dry run complete. No changes were written.");
    return;
  }

  const ops = docsToMigrate.map((doc, index) => ({
    updateOne: {
      filter: { _id: doc._id },
      update: { $set: { projectId: startProjectId + index } },
    },
  }));

  const writeResult = await projects.bulkWrite(ops, { ordered: true });

  const newNextNumber = startProjectId + docsToMigrate.length;
  if (counterDoc?._id) {
    await counters.updateOne({ _id: counterDoc._id }, { $set: { nextNumber: newNextNumber } });
  } else {
    await counters.insertOne({
      nextNumber: newNextNumber,
      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0,
    });
  }

  console.log("----------------------------------------");
  console.log(`Updated projects: ${writeResult.modifiedCount}`);
  console.log(`Counter nextNumber updated to: ${newNextNumber}`);
}

migrateProjectIds()
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
