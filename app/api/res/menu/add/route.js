
import { NextResponse } from "next/server";
import { MenuItem } from "@/models/menuItem.model";
import { apiError } from "@/utils/apiError";
import { withAuth } from "@/utils/withAuth";
import { apiResponse } from "@/utils/apiResponse";
import dbConnect from "@/libs/dbConnect";
async function addMenuItem(req) {
    try {
        await dbConnect();
        const { name, description, price, category, isVeg, image } = await req.json();
        if (!name || !price || !category || isVeg === undefined) {
            return NextResponse.json(new apiError(400, "name, price, isVeg and category are required"));
        }
        const { restaurantId } = req.user;
        const menuItem = await MenuItem.create({
            restaurantId,
            name,
            description,
            price,
            category,
            isVeg,
            image: image || "",
        });
       
        console.log("menu item:",menuItem)
        return NextResponse.json(new apiResponse(201, menuItem, "Menu item added successfully"), { status: 201 });


    } catch (error) {
        console.error("Error adding menu item:", error);
        return NextResponse.json(new apiError(500, "Error adding menu item"));
    }
}

export const POST = withAuth(addMenuItem, ["manager"]);