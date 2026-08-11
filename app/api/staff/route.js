import dbConnect from "@/libs/dbConnect";
import { User } from "@/models/user.model";
import { apiError } from "@/utils/apiError";
import { apiResponse } from "@/utils/apiResponse";
import { withAuth } from "@/utils/withAuth";
import { NextResponse } from "next/server";

async function listStaff(req) {
    try {
        await dbConnect();
        const { restaurantId } = req.user;

        const staff = await User.find({ restaurantId })
            .select("-password -refreshToken")
            .sort({ createdAt: -1 });

        return NextResponse.json(new apiResponse(200, staff, "Staff fetched successfully"), { status: 200 });
    } catch (error) {
        console.error("Error fetching staff:", error);
        return NextResponse.json(new apiError(500, "Error fetching staff"));
    }
}

export const GET = withAuth(listStaff, ["manager"]);
