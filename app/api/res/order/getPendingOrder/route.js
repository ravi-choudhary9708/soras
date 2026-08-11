import dbConnect from "@/libs/dbConnect";
import { Order } from "@/models/order.model";
import { apiError } from "@/utils/apiError";
import { apiResponse } from "@/utils/apiResponse";
import { withAuth } from "@/utils/withAuth";
import { NextResponse } from "next/server";


async function getPendingOrder(req) {
    try {
        await dbConnect();
        // restaurantId comes from the authenticated user — no need for body parse on GET
        const restaurantId = req.user.restaurantId;

        const pendingOrders = await Order.find({
            restaurantId,
            isVerified: false,
            orderStatus: "pending",
        }).sort({ createdAt: 1 });

        const now = new Date();
        const operationalTray = pendingOrders.map(order => {
            const orderAgeMs = now.getTime() - new Date(order.createdAt).getTime();
            const minutesOld = Math.floor(orderAgeMs / 60000);
            return {
                ...order.toObject(),
                minutesOld
            };
        });

        return NextResponse.json(
            new apiResponse(200, operationalTray, "Fetched pending orders successfully"),
            { status: 200 }
        );
    } catch (error) {
        console.log("error during getting order:", error.message);
        return NextResponse.json(new apiError(500, error.message || "Internal server error"));
    }
}

export const GET = withAuth(getPendingOrder, ["chef", "manager", "staff"]);