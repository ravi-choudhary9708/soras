import dbConnect from "@/libs/dbConnect";
import { MenuItem } from "@/models/menuItem.model";
import { apiError } from "@/utils/apiError";
import { apiResponse } from "@/utils/apiResponse";
import { withAuth } from "@/utils/withAuth";
import { NextResponse } from "next/server";

async function updateMenuItem(req, { params }) {
    try {
        await dbConnect();
        const { id } = params;
        const { restaurantId } = req.user;
        const updates = await req.json();

        // Allow only safe fields to be updated
        const allowed = ["name", "description", "price", "category", "isVeg", "image", "isAvailable", "isHalfAllowed"];
        const sanitized = {};
        for (const key of allowed) {
            if (updates[key] !== undefined) sanitized[key] = updates[key];
        }

        if (sanitized.name) sanitized.name = sanitized.name.toLowerCase().trim();
        if (sanitized.category) sanitized.category = sanitized.category.toLowerCase().trim();

        const updated = await MenuItem.findOneAndUpdate(
            { _id: id, restaurantId },
            { $set: sanitized },
            { new: true }
        );

        if (!updated) {
            return NextResponse.json(new apiError(404, "Menu item not found or not owned by this restaurant"));
        }

        return NextResponse.json(new apiResponse(200, updated, "Menu item updated successfully"));
    } catch (error) {
        console.error("Error updating menu item:", error);
        return NextResponse.json(new apiError(500, "Error updating menu item"));
    }
}

async function deleteMenuItem(req, { params }) {
    try {
        await dbConnect();
        const { id } = params;
        const { restaurantId } = req.user;

        const deleted = await MenuItem.findOneAndDelete({ _id: id, restaurantId });
        if (!deleted) {
            return NextResponse.json(new apiError(404, "Menu item not found or not owned by this restaurant"));
        }

        return NextResponse.json(new apiResponse(200, { id }, "Menu item deleted successfully"));
    } catch (error) {
        console.error("Error deleting menu item:", error);
        return NextResponse.json(new apiError(500, "Error deleting menu item"));
    }
}

export const PUT = withAuth(updateMenuItem, ["manager"]);
export const DELETE = withAuth(deleteMenuItem, ["manager"]);
