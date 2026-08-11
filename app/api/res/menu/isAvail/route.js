import { NextResponse } from "next/server";
import dbConnect from "@/libs/dbConnect";
import { MenuItem } from "@/models/menuItem.model";
import { apiError } from "@/utils/apiError";
import { apiResponse } from "@/utils/apiResponse";
import { withAuth } from "@/utils/withAuth";

async function toggleMenuItemAvailability(req) {
    try {
        await dbConnect();
        const { menuItemId, isAvailable } = await req.json();

        if (!menuItemId || isAvailable === undefined) {
            return NextResponse.json(new apiError(400, "menuItemId and isAvailable are required"));
        }

        const { restaurantId } = req.user;
        const updatedMenuItem = await MenuItem.findOneAndUpdate(
            { _id: menuItemId, restaurantId },
            { isAvailable: Boolean(isAvailable) },
            { new: true }
        );

        if (!updatedMenuItem) {
            return NextResponse.json(new apiError(404, "Menu item not found or not owned by the restaurant"));
        }

        const updatedState = updatedMenuItem.isAvailable ? "available" : "out of stock";
        return NextResponse.json(new apiResponse(200, updatedMenuItem, `Menu item is now ${updatedState}`));

    } catch (error) {
        console.error("Error updating menu item availability:", error);
        return NextResponse.json(new apiError(500, "Error updating menu item availability"));
    }
}

export const PUT = withAuth(toggleMenuItemAvailability, ["manager", "staff"]);