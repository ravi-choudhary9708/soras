import { NextResponse } from "next/server";
import { apiResponse } from "@/utils/apiResponse";

// Clears customer auth cookies
export async function POST() {
    const response = NextResponse.json(
        new apiResponse(200, null, "Customer logged out successfully"),
        { status: 200 }
    );

    const clearOptions = {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        path: "/",
        maxAge: 0,
    };

    // Clear both possible customer token cookie names
    response.cookies.set("customerAccessToken", "", clearOptions);
    response.cookies.set("customerRefreshToken", "", clearOptions);
    response.cookies.set("accessToken", "", clearOptions);
    response.cookies.set("refreshToken", "", clearOptions);

    return response;
}
