import dbConnect from "@/libs/dbConnect";
import { Order } from "@/models/order.model";
import { Table } from "@/models/table.model";
import { apiError } from "@/utils/apiError";
import { apiResponse } from "@/utils/apiResponse";
import { withAuth } from "@/utils/withAuth";
import { NextResponse } from "next/server";

async function getStaffOrderFeed(req) {
    try {
        await dbConnect();
        const { restaurantId } = req.user;

        // Fetch all active orders: pending (need approval), preparing (being cooked), ready (to be served)
        const orders = await Order.find({
            restaurantId,
            orderStatus: { $in: ["pending", "preparing", "ready"] }
        })
            .sort({ createdAt: 1 })
            .populate("tableId", "tableNumber room");

        const now = new Date();
        const enriched = orders.map(order => {
            const orderAgeMs = now.getTime() - new Date(order.createdAt).getTime();
            const minutesOld = Math.floor(orderAgeMs / 60000);
            return {
                ...order.toObject(),
                minutesOld
            };
        });

        return NextResponse.json(
            new apiResponse(200, enriched, "Staff order feed fetched successfully"),
            { status: 200 }
        );
    } catch (error) {
        console.error("Error fetching staff orders:", error);
        return NextResponse.json(new apiError(500, error.message || "Internal server error"));
    }
}

export const GET = withAuth(getStaffOrderFeed, ["staff", "manager", "chef"]);
