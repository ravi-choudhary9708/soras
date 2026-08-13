import dbConnect from "@/libs/dbConnect";
import { Order } from "@/models/order.model";
import { Table } from "@/models/table.model";
import { apiError } from "@/utils/apiError";
import { apiResponse } from "@/utils/apiResponse";
import { withAuth } from "@/utils/withAuth";
import { NextResponse } from "next/server";

// Staff places an order on behalf of a customer for a given table number.
// The order is auto-verified (no customer approval needed).
async function staffPlaceOrderHandler(req) {
    try {
        await dbConnect();
        const { restaurantId, _id: staffId } = req.user;
        const { tableNumber, items } = await req.json();

        if (!tableNumber || !items || items.length === 0) {
            return NextResponse.json(new apiError(400, "tableNumber and items are required"));
        }

        // Find the table — it can be free or occupied (staff can order for any table)
        const table = await Table.findOne({ restaurantId, tableNumber });
        if (!table) {
            return NextResponse.json(new apiError(404, `Table ${tableNumber} not found in your restaurant`));
        }

        // If table is free, mark it as occupied and start a new session
        if (table.status === "free") {
            table.status = "occupied";
            table.sessionToken = `staff_${Date.now()}`;
            table.sessionExpiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours
            await table.save();
        }

        const processedItems = items.map(item => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            name: item.name,
            price: item.price || null,
            portion: item.portion || "full",
        }));

        const newOrder = await Order.create({
            restaurantId,
            tableId: table._id,
            tableNumber: table.tableNumber,
            sessionToken: table.sessionToken,
            items: processedItems,
            customerId: null,
            isVerifiedBy: staffId,
            isVerified: true, // Auto-verified since staff is placing it
            orderStatus: "preparing", // Skips pending, goes straight to KOT
            PaymentStatus: "open",
        });

        return NextResponse.json(
            new apiResponse(201, newOrder, `Order placed for Table ${tableNumber} and sent to KOT`),
            { status: 201 }
        );
    } catch (error) {
        console.error("Staff order placement error:", error);
        return NextResponse.json(new apiError(500, error.message || "Internal server error"));
    }
}

export const POST = withAuth(staffPlaceOrderHandler, ["staff", "manager"]);
