import { NextResponse } from "next/server";
import dbConnect from "@/libs/dbConnect";
import { User } from "@/models/user.model";
import { withAuth } from "@/utils/withAuth";
import { apiError } from "@/utils/apiError";
import { apiResponse } from "@/utils/apiResponse";

async function updateProfileHandler(req) {
    try {
        await dbConnect();
        const { fullName, username, email, phone } = await req.json();
        
        // Target specific user verified by auth middleware
        const userId = req.user._id;

        if (!fullName || !username || !email || !phone) {
            return NextResponse.json(new apiError(400, "All account parameter coordinates are mandatory"));
        }

        // Check for username or email collisions excluding current operator
        const collisionCheck = await User.findOne({
            _id: { $ne: userId },
            $or: [{ username }, { email }]
        });

        if (collisionCheck) {
            return NextResponse.json(new apiError(409, "Username identifier or email target is already allocated"));
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                $set: {
                    fullName: fullName.trim(),
                    username: username.trim().toLowerCase(),
                    email: email.trim().toLowerCase(),
                    phone: String(phone).trim()
                }
            },
            { new: true }
        ).select("-password -refreshToken");

        return NextResponse.json(
            new apiResponse(200, updatedUser, "Manager credential configuration updated successfully"),
            { status: 200 }
        );

    } catch (error) {
        console.error("Profile synchronization database fault:", error);
        return NextResponse.json(new apiError(500, "Failed to completely synchronize profile data updates"));
    }
}

export const PUT = withAuth(updateProfileHandler, ["manager"]);