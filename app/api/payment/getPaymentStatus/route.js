import { Payment } from "@/models/payment.model";
import dbConnect from "@/libs/dbConnect";
import { apiError } from "@/utils/apiError";
import { apiResponse } from "@/utils/apiResponse";
import { withAuth } from "@/utils/withAuth";
import { NextResponse } from "next/server";

// Platform admin: get ALL payments across all restaurants, sorted newest first
async function getPaymentStatus(req) {
    try {
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status"); // optional filter: pending|approved|rejected

        const filter = {};
        if (status) filter.status = status;

        const payments = await Payment.find(filter)
            .sort({ createdAt: -1 })
            .populate("restaurantId", "name isAccountActive")
            .populate("managerId", "fullName email");

        return NextResponse.json(
            new apiResponse(200, payments, "Payments fetched successfully"),
            { status: 200 }
        );
    } catch (error) {
        console.error("Get payment status error:", error);
        return NextResponse.json(new apiError(500, error.message || "Internal server error"));
    }
}

export const GET = withAuth(getPaymentStatus, ["admin"]);