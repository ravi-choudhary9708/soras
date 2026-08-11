import mongoose from "mongoose";
import dbConnect from "@/libs/dbConnect";
import { NextResponse } from "next/server";

// Lightweight inline schema — no separate model file needed for error logs
const errorLogSchema = new mongoose.Schema({
  message:    { type: String, required: true },
  stack:      { type: String },
  url:        { type: String },
  userAgent:  { type: String },
  userId:     { type: String },
  role:       { type: String },
  context:    { type: String },          // e.g. "ErrorBoundary", "unhandledRejection"
  extra:      { type: mongoose.Schema.Types.Mixed }, // any extra metadata
  severity:   { type: String, enum: ["info", "warning", "error", "critical"], default: "error" },
}, { timestamps: true });

const ErrorLog = mongoose.models.ErrorLog || mongoose.model("ErrorLog", errorLogSchema);

// POST /api/log/error — called by client ErrorBoundary and global handlers
export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();

    const { message, stack, url, context, extra, severity } = body;
    if (!message) return NextResponse.json({ success: false }, { status: 400 });

    // Best-effort: read user info from cookie if available
    const token = req.cookies?.get("accessToken")?.value;
    let userId = null, role = null;
    if (token) {
      try {
        // Decode without verification — just for logging context (not auth)
        const [, payload] = token.split(".");
        const decoded = JSON.parse(Buffer.from(payload, "base64url").toString());
        userId = decoded._id;
        role = decoded.role;
      } catch { /* ignore */ }
    }

    await ErrorLog.create({
      message,
      stack,
      url,
      userAgent: req.headers.get("user-agent"),
      userId,
      role,
      context,
      extra,
      severity: severity || "error",
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    // Never let error logging itself crash the app
    console.error("[ErrorLog] Failed to write error log:", err.message);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
