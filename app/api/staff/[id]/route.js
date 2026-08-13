import dbConnect from "@/libs/dbConnect";
import { User } from "@/models/user.model";
import { apiError } from "@/utils/apiError";
import { apiResponse } from "@/utils/apiResponse";
import { withAuth } from "@/utils/withAuth";
import { NextResponse } from "next/server";

async function deleteStaff(req, { params }) {
    try {
        await dbConnect();
        const { id } =await params;
        const { restaurantId, _id: managerId } = req.user;

        // Prevent manager from deleting themselves
        if (id === managerId.toString()) {
            return NextResponse.json(new apiError(400, "You cannot delete your own account"));
        }

        const deleted = await User.findOneAndDelete({ _id: id, restaurantId });
        if (!deleted) {
            return NextResponse.json(new apiError(404, "Staff member not found or not in your restaurant"));
        }

        return NextResponse.json(new apiResponse(200, { id }, "Staff member removed successfully"));
    } catch (error) {
        console.error("Error deleting staff:", error);
        return NextResponse.json(new apiError(500, "Error deleting staff member"));
    }
}

export const DELETE = withAuth(deleteStaff, ["manager"]);
