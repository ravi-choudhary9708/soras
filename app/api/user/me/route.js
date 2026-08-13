import { NextResponse } from "next/server";
import { withAuth } from "@/utils/withAuth";
import { apiResponse } from "@/utils/apiResponse";

// Returns the currently logged-in manager/staff user's profile
// from req.user (populated by withAuth middleware)
async function getMeHandler(req) {
    return NextResponse.json(
        new apiResponse(200, req.user, "User profile fetched successfully"),
        { status: 200 }
    );
}

export const GET = withAuth(getMeHandler, ["manager", "staff", "chef", "admin"]);
