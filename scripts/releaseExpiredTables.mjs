import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("❌ MONGODB_URI not found in .env.local");
  process.exit(1);
}

async function releaseExpired() {
  await mongoose.connect(uri);
  const db = mongoose.connection.client.db("test");
  const now = new Date();

  const result = await db.collection("tables").updateMany(
    {
      status: "occupied",
      sessionExpiresAt: { $lt: now }
    },
    {
      $set: {
        status: "free",
        sessionToken: null,
        sessionExpiresAt: null,
        isSettling: false
      }
    }
  );

  console.log(`✅ Successfully freed ${result.modifiedCount} expired tables.`);

  const tables = await db.collection("tables").find({}).sort({ tableNumber: 1 }).toArray();
  console.log("Current table statuses:");
  tables.forEach(t => {
    console.log(`  - Table ${t.tableNumber}: ${t.status}`);
  });

  await mongoose.disconnect();
  process.exit(0);
}

releaseExpired().catch(err => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
