import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not found in .env.local");
  process.exit(1);
}

async function cleanDB() {
  try {
    console.log("⏳ Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected!\n");

    const db = mongoose.connection.db;

    // Drop all users (staff, chef, manager)
    const usersResult = await db.collection("users").deleteMany({});
    console.log(`🗑️  Users (staff/manager/chef) deleted: ${usersResult.deletedCount}`);

    // Drop all customers
    const customersResult = await db.collection("customers").deleteMany({});
    console.log(`🗑️  Customers deleted: ${customersResult.deletedCount}`);

    // Drop all orders
    const ordersResult = await db.collection("orders").deleteMany({});
    console.log(`🗑️  Orders deleted: ${ordersResult.deletedCount}`);

    // Drop all restaurants (managers own these)
    const restaurantsResult = await db.collection("restaurants").deleteMany({});
    console.log(`🗑️  Restaurants deleted: ${restaurantsResult.deletedCount}`);

    // Drop all tables
    const tablesResult = await db.collection("tables").deleteMany({});
    console.log(`🗑️  Tables deleted: ${tablesResult.deletedCount}`);

    // Drop all payments
    const paymentsResult = await db.collection("payments").deleteMany({});
    console.log(`🗑️  Payments deleted: ${paymentsResult.deletedCount}`);

    console.log("\n✅ Database wiped clean. Ready for fresh onboarding.");
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected.");
    process.exit(0);
  }
}

cleanDB();
