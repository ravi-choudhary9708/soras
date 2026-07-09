import dbConnect from "@/libs/dbConnect";
import { Table } from "@/models/table.model";
import { apiError } from "@/utils/apiError";
import { NextResponse } from "next/server";
import { Order } from "@/models/order.model";

export async function POST(req){
    try {
        await dbConnect();

        const {restaurantId, tableNumber, items}= await req.json();
        // Basic payload validation
        if (!restaurantId || !tableNumber || !items || items.length === 0) {
            return NextResponse.json(new apiError(400, "Missing required order parameters or cart is empty"));
        }

        // 1. Fetch the physical table configuration
        const table= await Table.findOne({restaurantId,tableNumber});
        if(!table){
            return NextResponse.json(new apiError(404,"table configuration not found, contact staff"));

        }

  const activeSessionToken= table.sessionToken;
//   check if table is free, if so generate new session token
if(table.status==="free"|| !table.sessionToken){
    activeSessionToken=crypto.randomBytes(8).toString("hex");

    table.status="occupied";
    table.sessionToken=activeSessionToken;

    // Set a safety timeout loop (e.g., session auto-expires after 4 hours)
            table.sessionExpiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000); 
            await table.save();
}else {
            // 3. Re-ordering Check: If the table is already occupied, ensure it hasn't timed out
            if (table.sessionExpiresAt && new Date() > new Date(table.sessionExpiresAt)) {
                return NextResponse.json(new apiError(403, "Session expired. Please alert staff to clear the table layout."));
            }
        }
   
        const newOrder = await Order.create({
            restaurantId,
            tableNumber,
            sessionToken: activeSessionToken, // Chained together perfectly
            items: items.map(i => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
            orderStatus: "pending",
            isVerified: false
        });

        // 📱 Send back the sessionToken to the customer's browser 
        // So their phone can store it in localStorage/Cookies for live tracking updates!
        return NextResponse.json(
            new apiResponse(201, { newOrder, sessionToken: activeSessionToken }, "Order sent to floor counter successfully!"),
            { status: 201 }
        ); 
 

    } catch (error) {
        console.error("ORDER ENTRY ENGINE FAILURE:", error);
        return NextResponse.json(new apiError(500, error.message));
    }
}