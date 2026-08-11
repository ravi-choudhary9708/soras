import { NextResponse } from "next/server";
import { apiResponse } from "@/utils/apiResponse";

// Clears both auth cookies to log the user out cleanly
export async function POST() {
    const response = NextResponse.json(
        new apiResponse(200, null, "Logged out successfully"),
        { status: 200 }
    );

    const clearOptions = {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        path: "/",
        maxAge: 0, // immediately expire
    };

    response.cookies.set("accessToken", "", clearOptions);
    response.cookies.set("refreshToken", "", clearOptions);

    return response;
}
