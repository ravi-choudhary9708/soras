import dbConnect from "@/libs/dbConnect";
import { Order } from "@/models/order.model";
import { apiResponse } from "@/utils/apiResponse";
import { apiError } from "@/utils/apiError";
import { NextResponse } from "next/server";


export async function GET(req){
   try {
     await dbConnect();
    const { searchParams } = new URL(req.url);
        const restaurantId = searchParams.get("restaurantId");
        const tableNumber = searchParams.get("tableNumber");
        const sessionToken = searchParams.get("sessionToken");

        if (!restaurantId || !tableNumber || !sessionToken) {
            return NextResponse.json(new apiError(400, "Missing required session tracking validation keys"), { status: 400 });
        }

        // Fetch all orders matching this specific dynamic table session sitting
        // This includes items cooking (preparing), ready, or already eaten (served)
        const liveOrders = await Order.find({
            restaurantId,
            tableNumber,
            sessionToken,
            orderStatus: { $in: ["pending", "preparing", "ready", "served"] }
        }).sort({ createdAt: 1 });

        // Calculate running financial totals dynamically
        const currentRunningTotal = liveOrders.reduce((acc, order) => acc + order.totalAmount, 0);

        return NextResponse.json(
            new apiResponse(200, { orders: liveOrders, currentRunningTotal }, "Live running session bill compiled successfully."),
            { status: 200 }
        );
   } catch (error) {
    return NextResponse.json(new apiError(500, error.message), { status: 500 });
   }
}