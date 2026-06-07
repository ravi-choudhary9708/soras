
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import MenuItem from "@/models/menuItem.model";
import apiError from "@/utils/apiError";
import withAuth from "@/middleware/withAuth";
import apiresponse from "@/utils/apiResponse";

async function toggleMenuItemAvailability(req){
    try {
        await dbConnect();
        // get availability status and menu item id from request body
        const {menuItemId, isAvailable}= await req.json();
        // validate input
        if(!menuItemId || isAvailable === undefined){
            return NextResponse.json(new apiError(400,"menuItemId and isAvailable are required"));
        }
        // find menu item and update availability and make sure the menu item belongs to the restaurant of the user
        const {restaurantId}= req.user.restaurantId;
        const updatedMenuItem= await MenuItem.findOneAndUpdate({
            _id: menuItemId,
            restaurantId: restaurantId
        }, {
            isAvailable: Boolean(isAvailable)
        }, {
            new: true
        });
        // validate if menu item was found and updated
        if(!updatedMenuItem){
            return NextResponse.json(new apiError(404,"Menu item not found or not owned by the restaurant"));
        }
        // return updated menu item with message indicating new availability status
        const updatedState= updatedMenuItem.isAvailable ? "available" : "out of stock";
        return NextResponse.json(new apiresponse(200,updatedMenuItem,`Menu item is now ${updatedState}`));

    } catch (error) {
        console.error("Error updating menu item availability:", error);
        return NextResponse.json(new apiError(500,"Error updating menu item availability"));
    }
}

export const PUT=withAuth(toggleMenuItemAvailability,["manager","staff"]);