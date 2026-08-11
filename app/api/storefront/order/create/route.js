import dbConnect from "@/libs/dbConnect";
import { Table } from "@/models/table.model";
import { apiError } from "@/utils/apiError";
import { apiResponse } from "@/utils/apiResponse";
import { NextResponse } from "next/server";
import { Order } from "@/models/order.model";
import jwt from "jsonwebtoken";

export async function POST(req) {
    try {
        await dbConnect();

        const { restaurantId, tableNumber, sessionToken, items } = await req.json();

        if (!restaurantId || !tableNumber || !sessionToken || !items || items.length === 0) {
            return NextResponse.json(new apiError(400, "Missing required order parameters or cart is empty"));
        }

        // Validate the table session
        const table = await Table.findOne({ restaurantId, tableNumber });
        if (!table) {
            return NextResponse.json(new apiError(404, "Table configuration not found, contact staff"));
        }

        if (table.status !== "occupied" || table.sessionToken !== sessionToken) {
            return NextResponse.json(new apiError(401, "Your dining session is expired or invalid. Please scan the QR code again."));
        }

        if (new Date() > table.sessionExpiresAt) {
            return NextResponse.json(new apiError(401, "Your session token is expired. Please rescan the QR code."));
        }

        // Determine who is ordering (staff vs. customer)
        let role = "customer";
        let authenticatedUserId = null;

        const token = req.cookies?.get("accessToken")?.value || req.headers.get("Authorization")?.replace("Bearer ", "");
        if (token) {
            try {
                const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
                role = decodedToken.role;
                authenticatedUserId = decodedToken._id;
            } catch {
                role = "customer";
            }
        }

        const processedItems = items.map(item => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            name: item.name,
            price: item.price || null
        }));

        const isStaffUser = (role === "staff" || role === "manager" || role === "chef");
        const orderPayload = {
            restaurantId,
            tableId: table._id,
            items: processedItems,
            customerId: !isStaffUser ? authenticatedUserId : null,
            isVerifiedBy: isStaffUser ? authenticatedUserId : null,
            isVerified: isStaffUser,
            orderStatus: isStaffUser ? "preparing" : "pending",
            PaymentStatus: "open",
        };

        const newOrder = await Order.create(orderPayload);

        return NextResponse.json(
            new apiResponse(201, { newOrder, sessionToken }, "Order sent to floor counter successfully!"),
            { status: 201 }
        );

    } catch (error) {
        console.error("Order entry error:", error);
        return NextResponse.json(new apiError(500, error.message || "Internal server error"));
    }
}