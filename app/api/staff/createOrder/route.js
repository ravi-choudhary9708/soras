import { NextResponse } from "next/server";
import dbConnect from "@/libs/dbConnect";
import { Table } from "@/models/table.model";
import { Order } from "@/models/order.model";
import crypto from "crypto";
import { withAuth } from "@/utils/withAuth";
import { apiResponse } from "@/utils/apiResponse";
import { apiError } from "@/utils/apiError";

async function staffCreateOrderHandler(req) {
    try {
        await dbConnect();
        const { tableNumber, items } = await req.json();
        const { restaurantId } = req.user; // Securely extracted via auth token middleware

        if (!tableNumber || !items || items.length === 0) {
            return NextResponse.json(new apiError(400, "Table number and item array are required"));
        }

        // 1. Fetch or initialize the target table profile
        let table = await Table.findOne({ restaurantId, tableNumber });
        if (!table) {
            return NextResponse.json(new apiError(404, `Physical configuration for Table ${tableNumber} not found`));
        }

        let activeSessionToken = table.sessionToken;

        // 🤝 AUTOMATED ONBOARDING: If the table was free, the waiter opening an order instantly occupies it
        if (table.status === "free" || !table.sessionToken) {
            activeSessionToken = crypto.randomBytes(8).toString("hex");
            table.status = "occupied";
            table.sessionToken = activeSessionToken;
            table.sessionExpiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 Hour Baseline
            await table.save();
        }

        // 2. Map items structure directly into database array schema requirements
        const sanitizedItems = items.map(i => ({
            menuItemId: i.menuItemId,
            quantity: i.quantity
        }));

        // 3. 🚀 FAST-TRACK ENTRY: Save order directly into the kitchen stream
        const newOrder = await Order.create({
            restaurantId,
            tableNumber,
            sessionToken: activeSessionToken,
            items: sanitizedItems,
            orderStatus: "preparing", // 🎯 BYPASS: Skips "pending" status entirely, goes straight to Chef KDS
            isVerified: true          // 🎯 BYPASS: Set to true because a waiter verified it in-person
        });

        return NextResponse.json(
            new apiResponse(201, newOrder, `Order for Table ${tableNumber} sent directly to the kitchen! 🍳`),
            { status: 201 }
        );

    } catch (error) {
        console.error("🔥 STAFF ORDER PUNCH FAILURE:", error);
        return NextResponse.json(new apiError(500, error.message));
    }
}

// 🛡️ SECURITY LAYER: Restrict this route exclusively to logged-in Staff and Managers
export const POST = withAuth(staffCreateOrderHandler, ["staff", "manager"]);