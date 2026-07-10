import mongoose from "mongoose";
import bcrypt from "bcrypt"; // Make sure to use the hashing library used in your User model
import dotenv from "dotenv";
import path from "path";
import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

// Load environment variables from your local variables file
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ Error: MONGODB_URI is not defined in your environment variables file.");
  process.exit(1);
}

// Inline definition of your schema to keep the execution completely independent and lightweight
const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  isAccountVerified: { type: Boolean, default: true }
}, { timestamps: true });

const Admin = mongoose.models.Admin || mongoose.model("Admin", adminSchema);

async function seedAdmin() {
  try {
    console.log("⏳ Connecting to MongoDB database cluster...");
    await mongoose.connect(MONGODB_URI);
    console.log("🚀 Connection established perfectly!");

    // 🎯 DEFINE YOUR CREDENTIALS HERE Safely
    const adminEmail = "ravichy.in"; // Replace with your professional email address
    const plainPassword = "ravi9708"; // Replace with a strong, complex password string

    // Check if the administrator profile already exists
    const existingAdmin = await Admin.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log(`⚠️ User with email ${adminEmail} already exists inside your records. Seeding skipped.`);
      process.exit(0);
    }

    // Hash the password exactly how your standard authentication routes expect it
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    // Create the master super_admin document profile layout
    const newAdmin = await Admin.create({
      name: "Ravi chy",
      email: adminEmail,
      password: hashedPassword,
      role: "admin", // 👑 This gives you absolute clearance over all multi-tenant endpoints
      isAccountVerified: true
    });

    console.log("-----------------------------------------------------");
    console.log("✅ SUPER ADMIN SEEDED SUCCESSFULLY!");
    console.log(`👤 Name: ${newAdmin.name}`);
    console.log(`📧 Email: ${newAdmin.email}`);
    console.log(`🔑 Role Signature: ${newAdmin.role}`);
    console.log("-----------------------------------------------------");
    console.log("🔒 Keep these credentials secret. You are ready to log into /admin/super!");

  } catch (error) {
    console.error("❌ Critical Seeding Engine Failure:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from database cluster smoothly.");
    process.exit(0);
  }
}

seedAdmin();