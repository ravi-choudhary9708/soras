import dbConnect from "@/libs/dbConnect";
import { MenuItem } from "@/models/menuItem.model";
import { apiError } from "@/utils/apiError";
import { apiResponse } from "@/utils/apiResponse";
import { withAuth } from "@/utils/withAuth";
import { NextResponse } from "next/server";

async function getMenuItems(req) {
    try {
        await dbConnect();
        const { restaurantId } = req.user;
        const { searchParams } = new URL(req.url);
        const category = searchParams.get("category");
        const isAvailable = searchParams.get("isAvailable");

        const filter = { restaurantId };
        if (category) filter.category = category.toLowerCase();
        if (isAvailable !== null && isAvailable !== undefined) {
            filter.isAvailable = isAvailable === "true";
        }

        const items = await MenuItem.find(filter).sort({ category: 1, name: 1 });
        return NextResponse.json(new apiResponse(200, items, "Menu items fetched successfully"), { status: 200 });
    } catch (error) {
        console.error("Error fetching menu:", error);
        return NextResponse.json(new apiError(500, "Error fetching menu items"));
    }
}

export const GET = withAuth(getMenuItems, ["manager", "staff"]);
