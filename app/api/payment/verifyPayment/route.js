import { Payment } from "@/models/payment.model";
import { Restaurant } from "@/models/restaurant.model";
import { apiError } from "@/utils/apiError";
import { apiResponse } from "@/utils/apiResponse";
import { NextResponse } from "next/server";
import dbConnect from "@/libs/dbConnect";
import { withAuth } from "@/utils/withAuth";

async function verifyPayment(req) {
    try {
        await dbConnect();
        const { paymentId, status, rejectionReason } = await req.json();

        if (!paymentId || !status || (status === "rejected" && !rejectionReason)) {
            return NextResponse.json(new apiError(400, "paymentId, status and rejection reason (if rejected) are required"));
        }
        if (!["approved", "rejected"].includes(status)) {
            return NextResponse.json(new apiError(400, "Invalid status. Must be 'approved' or 'rejected'"));
        }

        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return NextResponse.json(new apiError(404, "Payment not found"));
        }
        if (payment.status !== "pending") {
            return NextResponse.json(new apiError(400, "Only pending payments can be verified"));
        }

        payment.status = status;
        payment.verifiedAt = new Date();
        payment.rejectionReason = status === "rejected" ? rejectionReason : undefined;
        await payment.save();

        let restaurant = null;
        if (status === "approved") {
            const expiryDate = new Date();
            expiryDate.setMonth(expiryDate.getMonth() + 1);
            restaurant = await Restaurant.findByIdAndUpdate(
                payment.restaurantId,
                { isAccountActive: true, planExpiresAt: expiryDate },
                { new: true }
            );
        } else if (status === "rejected") {
            restaurant = await Restaurant.findByIdAndUpdate(
                payment.restaurantId,
                { isAccountActive: false },
                { new: true }
            );
        }

        return NextResponse.json(new apiResponse(200, { payment, restaurant }, "Payment verified successfully"));
    } catch (error) {
        console.log("verifyPayment error:", error);
        return NextResponse.json(new apiError(500, "An error occurred while verifying the payment"));
    }
}

// Only platform admin can approve/reject restaurant subscription payments
export const POST = withAuth(verifyPayment, ["admin"]);
