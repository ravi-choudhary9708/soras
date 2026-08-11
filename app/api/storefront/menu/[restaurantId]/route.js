import dbConnect from "@/libs/dbConnect";
import { MenuItem } from "@/models/menuItem.model";
import { Restaurant } from "@/models/restaurant.model";
import { apiError } from "@/utils/apiError";
import { apiResponse } from "@/utils/apiResponse";
import { NextResponse } from "next/server";

// Public endpoint — no auth required, used by customer storefront after QR scan
export async function GET(req, { params }) {
    try {
        await dbConnect();
        const { restaurantId } = params;

        // Verify restaurant exists and is active
        const restaurant = await Restaurant.findById(restaurantId).select("name isAccountActive");
        if (!restaurant) {
            return NextResponse.json(new apiError(404, "Restaurant not found"), { status: 404 });
        }
        if (!restaurant.isAccountActive) {
            return NextResponse.json(new apiError(403, "Restaurant account is inactive"), { status: 403 });
        }

        const items = await MenuItem.find({ restaurantId, isAvailable: true }).sort({ category: 1, name: 1 });

        // Group by category for easy rendering
        const menuByCategory = {};
        for (const item of items) {
            const cat = item.category;
            if (!menuByCategory[cat]) menuByCategory[cat] = [];
            menuByCategory[cat].push(item);
        }

        return NextResponse.json(
            new apiResponse(200, {
                restaurantName: restaurant.name,
                menu: menuByCategory,
                allItems: items
            }, "Menu fetched successfully"),
            { status: 200 }
        );
    } catch (error) {
        console.error("Error fetching public menu:", error);
        return NextResponse.json(new apiError(500, "Error fetching menu"), { status: 500 });
    }
}
