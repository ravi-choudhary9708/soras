import dbConnect from "@/libs/dbConnect";
import { Order } from "@/models/order.model";
import { Table } from "@/models/table.model";
import { apiResponse } from "@/utils/apiResponse";
import { apiError } from "@/utils/apiError";
import { NextResponse } from "next/server";

export async function GET(req) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const restaurantId = searchParams.get("restaurantId");
        const tableId = searchParams.get("tableId");
        const sessionToken = searchParams.get("sessionToken");

        if (!restaurantId || !tableId) {
            return NextResponse.json(new apiError(400, "Missing required params: restaurantId and tableId"), { status: 400 });
        }

        // Validate the session token matches the table
        if (sessionToken) {
            const table = await Table.findOne({ _id: tableId, restaurantId });
            if (!table || table.sessionToken !== sessionToken) {
                return NextResponse.json(new apiError(401, "Invalid session"), { status: 401 });
            }
        }

        // Fetch all orders for this table in this session
        const liveOrders = await Order.find({
            restaurantId,
            tableId,
            orderStatus: { $in: ["pending", "preparing", "ready", "served"] }
        }).sort({ createdAt: 1 });

        const currentRunningTotal = liveOrders.reduce((acc, order) => acc + order.totalAmount, 0);

        return NextResponse.json(
            new apiResponse(200, { orders: liveOrders, currentRunningTotal }, "Live session bill compiled successfully."),
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json(new apiError(500, error.message), { status: 500 });
    }
}