import mongoose from "mongoose";
import bcrypt from "bcrypt"; // Make sure to use the hashing library used in your User model
import dotenv from "dotenv";
import path from "path";


// Load environment variables from your local variables file
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ Error: MONGODB_URI is not defined in your environment variables file.");
  process.exit(1);
}



// Inline definition of your schema to avoid Next.js alias resolution issues in raw Node.js
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  fullName: { type: String },
  password: { type: String, required: true },
  role: { type: String, required: true },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, default: null }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);

async function seedAdmin() {
  try {
    console.log("⏳ Connecting to MongoDB database cluster...");
    await mongoose.connect(MONGODB_URI);
    console.log("🚀 Connection established perfectly!");

    // 🎯 DEFINE YOUR CREDENTIALS HERE Safely
    const adminEmail = "ravichy.in@gmail.com"; 
    const adminUsername = "superadmin";
    const plainPassword = "password123";

    // Check if the administrator profile already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log(`⚠️ User with email ${adminEmail} already exists inside your records. Seeding skipped.`);
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    // Create the master super_admin document profile layout
    const newAdmin = await User.create({
      fullName: "Soras Admin",
      username: adminUsername,
      email: adminEmail,
      phone: "0000000000",
      password: hashedPassword,
      role: "admin", 
      restaurantId: null
    });

    console.log("-----------------------------------------------------");
    console.log("✅ SUPER ADMIN SEEDED SUCCESSFULLY!");
    console.log(`👤 Name: ${newAdmin.fullName}`);
    console.log(`👤 Username: ${newAdmin.username}`);
    console.log(`📧 Email: ${newAdmin.email}`);
    console.log(`🔑 Password: ${plainPassword}`);
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