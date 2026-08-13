import dbConnect from "@/libs/dbConnect";
import { Order } from "@/models/order.model";
import { apiError } from "@/utils/apiError";
import { apiResponse } from "@/utils/apiResponse";
import { withAuth } from "@/utils/withAuth";
import { NextResponse } from "next/server";

async function listOrders(req) {
    try {
        await dbConnect();
        const { restaurantId } = req.user;
        const { searchParams } = new URL(req.url);

        const status = searchParams.get("status");
        const tableId = searchParams.get("tableId");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const skip = (page - 1) * limit;

        const filter = { restaurantId };
        if (status) {
            if (status === "active") {
                filter.orderStatus = { $in: ["preparing", "ready", "served"] };
            } else {
                filter.orderStatus = status;
            }
        }
        if (tableId) filter.tableId = tableId;

        const [orders, total] = await Promise.all([
            Order.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("tableId", "tableNumber room"),
            Order.countDocuments(filter)
        ]);

        return NextResponse.json(
            new apiResponse(200, {
                orders,
                pagination: { page, limit, total, pages: Math.ceil(total / limit) }
            }, "Orders fetched successfully"),
            { status: 200 }
        );
    } catch (error) {
        console.error("Error fetching orders:", error);
        return NextResponse.json(new apiError(500, "Error fetching orders"));
    }
}

export const GET = withAuth(listOrders, ["manager", "staff"]);
