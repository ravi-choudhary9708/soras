import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/libs/dbConnect";

export async function GET() {
    try {
        await dbConnect();
        
        // Check actual database connection state status from Mongoose core
        // 1 = connected, 0 = disconnected, 2 = connecting, 3 = disconnecting
        const dbStatus = mongoose.connection.readyState;
        
        const healthReport = {
            status: "healthy",
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            database: dbStatus === 1 ? "connected 🟢" : "disconnected 🔴"
        };

        if (dbStatus !== 1) {
            return NextResponse.json({ status: "unhealthy", ...healthReport }, { status: 503 });
        }

        return NextResponse.json(healthReport, { status: 200 });
    } catch (error) {
        return NextResponse.json({ 
            status: "error", 
            message: error.message,
            timestamp: new Date().toISOString() 
        }, { status: 500 });
    }
}