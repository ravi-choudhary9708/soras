import dbConnect from "@/libs/dbConnect";
import { Order } from "@/models/order.model";
import { apiError } from "@/utils/apiError";
import { apiResponse } from "@/utils/apiResponse";
import { withAuth } from "@/utils/withAuth";
import { NextResponse } from "next/server";

async function getOrderById(req, { params }) {
    try {
        await dbConnect();
        const { id } = await params;
        const { restaurantId } = req.user;

        const order = await Order.findOne({ _id: id, restaurantId })
            .populate("tableId", "tableNumber room")
            .populate("isVerifiedBy", "fullName username role");

        if (!order) {
            return NextResponse.json(new apiError(404, "Order not found"));
        }

        return NextResponse.json(new apiResponse(200, order, "Order fetched successfully"), { status: 200 });
    } catch (error) {
        console.error("Error fetching order:", error);
        return NextResponse.json(new apiError(500, "Error fetching order"));
    }
}

export const GET = withAuth(getOrderById, ["manager", "staff"]);
