import dbConnect from "@/libs/dbConnect";
import { User } from "@/models/user.model";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { apiResponse } from "@/utils/apiResponse";
import { apiError } from "@/utils/apiError";

export async function POST(req) {
    try {
        await dbConnect();

        const refreshToken = req.cookies?.get("refreshToken")?.value;
        if (!refreshToken) {
            return NextResponse.json(new apiError(401, "Refresh token missing"), { status: 401 });
        }

        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        } catch {
            return NextResponse.json(new apiError(401, "Refresh token expired or invalid"), { status: 401 });
        }

        const user = await User.findById(decoded._id).select("-password");
        if (!user || user.refreshToken !== refreshToken) {
            return NextResponse.json(new apiError(401, "Invalid refresh token"), { status: 401 });
        }

        const newAccessToken = user.generateAccessToken();

        const response = NextResponse.json(
            new apiResponse(200, { user: { _id: user._id, role: user.role } }, "Token refreshed"),
            { status: 200 }
        );

        response.cookies.set("accessToken", newAccessToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            path: "/",
            maxAge: 15 * 60 // 15 minutes
        });

        return response;
    } catch (error) {
        console.error("Token refresh error:", error);
        return NextResponse.json(new apiError(500, "Error refreshing token"), { status: 500 });
    }
}
