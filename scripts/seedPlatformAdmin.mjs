import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not found in .env.local");
  process.exit(1);
}

// ─── Your Admin Credentials (change these!) ───────────────────────────────
const ADMIN_EMAIL    = "admin@soras.in";
const ADMIN_USERNAME = "soras_admin";
const ADMIN_PASSWORD = "Admin@Soras2025";    // ← change this to something strong
const ADMIN_PHONE    = "9999999999";
const ADMIN_NAME     = "Soras Admin";
// ──────────────────────────────────────────────────────────────────────────

const userSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", default: null },
  username:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone:        { type: String, required: true, unique: true, trim: true },
  fullName:     { type: String, lowercase: true, trim: true },
  password:     { type: String, required: true },
  role:         { type: String, enum: ["manager", "staff", "chef", "admin"], default: "staff" },
  refreshToken: { type: String },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);

async function seedAdmin() {
  try {
    console.log("⏳ Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected!\n");

    const existing = await User.findOne({ email: ADMIN_EMAIL });
    if (existing) {
      console.log(`⚠️  Admin already exists: ${ADMIN_EMAIL}`);
      console.log(`   Role: ${existing.role}`);
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

    await User.create({
      username:     ADMIN_USERNAME,
      email:        ADMIN_EMAIL,
      phone:        ADMIN_PHONE,
      fullName:     ADMIN_NAME,
      password:     hashedPassword,
      role:         "admin",
      restaurantId: null,
    });

    console.log("✅ Platform Admin created!\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`  Email    : ${ADMIN_EMAIL}`);
    console.log(`  Password : ${ADMIN_PASSWORD}`);
    console.log(`  Role     : admin`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n🔐 Login at /auth with these credentials.");

  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected.");
    process.exit(0);
  }
}

seedAdmin();
