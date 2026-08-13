import dbConnect from "@/libs/dbConnect";
import { DailySummary } from "@/models/dailySummary";
import { Order } from "@/models/order.model";
import { Table } from "@/models/table.model";
import { apiError } from "@/utils/apiError";
import { apiResponse } from "@/utils/apiResponse";
import { withAuth } from "@/utils/withAuth";
import mongoose from "mongoose";
import { NextResponse } from "next/server";


async function settleTableHandler(req,{params}){
    try {
      await dbConnect();
     const { tableId } = await params;
    const {restaurantId}= req.user;
    const {cashPaid=0, upiPaid=0}= await req.json();
    if(cashPaid<0 || upiPaid<0){
        return NextResponse.json(new apiError(400,"payment amount cannot be negative"),{status:400})
    }


// We look for a table that is active, NOT currently locking, and belongs to this restaurant
    const tableLock = await Table.findOneAndUpdate(
        {_id:tableId,restaurantId,status:"occupied",isSettling:{$ne:true}},
        {$set: { isSettling: true }},
        { new: true }
    );
    if(!tableLock){
        return NextResponse.json(new apiError(404,"this table is free or session token not found"),{status:404});
    };

   const session= await mongoose.startSession();


  let grandTotalBill = 0;

        try {
            await session.withTransaction(async () => {
                // Fetch the locked table state tied to this atomic session context
                const table = await Table.findOne({ _id: id, restaurantId }).session(session);

                // Fetch ALL active (verified) orders currently linked to this dining sitting session
                const activeOrders = await Order.find({
                    restaurantId,
                    tableNumber: table.tableNumber,
                    sessionToken: table.sessionToken,
                    orderStatus: { $in: ["preparing", "ready", "served"] }
                }).session(session);

                if (activeOrders.length === 0) {
                    throw new Error("ERR_NO_ORDERS: No active/verified orders found to settle for this table session");
                }

                // Aggregate absolute billing data across all order documents
                grandTotalBill = activeOrders.reduce((acc, order) => acc + order.totalAmount, 0);
                const totalCalculatedPayload = cashPaid + upiPaid;

                // Protect against math discrepancies from the manager input
                if (totalCalculatedPayload !== grandTotalBill) {
                    throw new Error(`ERR_MATH: Total paid (₹${totalCalculatedPayload}) does not match grand bill total (₹${grandTotalBill})`);
                }

                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);

                // 📈 5. ATOMIC TOP ITEMS UPDATE (Eliminating Document Race Overwrites)
                // We compile a local map of exactly what this table consumed
                const itemMap = new Map();
                for (const order of activeOrders) {
                    for (const item of order.items) {
                        const existing = itemMap.get(item.menuItemId.toString()) || { name: item.name, qty: 0, rev: 0 };
                        itemMap.set(item.menuItemId.toString(), {
                            name: item.name,
                            qty: existing.qty + item.quantity,
                            rev: existing.rev + (item.price * item.quantity)
                        });
                    }
                }

                // Initialize or find today's ledger row atomically within the transaction
                let dailyDoc = await DailySummary.findOne({ restaurantId, date: todayStart }).session(session);
                if (!dailyDoc) {
                    dailyDoc = new DailySummary({ restaurantId, date: todayStart, topItems: [] });
                }

                // Apply updates to the topItems tracking subdocument array purely in-memory within the transaction isolation boundary
                for (const [menuItemId, data] of itemMap.entries()) {
                    const matchIdx = dailyDoc.topItems.findIndex(i => i.menuItemId.toString() === menuItemId);
                    if (matchIdx > -1) {
                        dailyDoc.topItems[matchIdx].totalQuantitySold += data.qty;
                        dailyDoc.topItems[matchIdx].totalRevenueGenerated += data.rev;
                    } else {
                        dailyDoc.topItems.push({
                            menuItemId: new mongoose.Types.ObjectId(menuItemId),
                            name: data.name,
                            totalQuantitySold: data.qty,
                            totalRevenueGenerated: data.rev
                        });
                    }
                }

                // Save metrics + apply increments to financial ledgers atomically inside the session block
                dailyDoc.totalCash += cashPaid;
                dailyDoc.toatlUpi += upiPaid; // Keeping your schema typo intact
                dailyDoc.totalOrder += activeOrders.length;
                await dailyDoc.save({ session });

                // Archive the order states to prevent them from showing on active monitors anymore
                await Order.updateMany(
                    { restaurantId, tableNumber: table.tableNumber, sessionToken: table.sessionToken },
                    { $set: { orderStatus: "completed" } }
                ).session(session);

                // Clear out the session data safely so the table returns to stock baseline
                table.status = "free";
                table.sessionToken = null;
                table.sessionExpiresAt = null;
                table.isSettling = false; // Release our safety state lock flag
                await table.save({ session });
            });

            // Clean up session allocations out of host memory
            await session.endSession();

            return NextResponse.json(
                new apiResponse(200, { grandTotalBill }, `Table settled cleanly! Total Bill: ₹${grandTotalBill} [Cash: ₹${cashPaid} | UPI: ₹${upiPaid}]`),
                { status: 200 }
            );

        } catch (transactionError) {
            await session.endSession();
            throw transactionError; // Escalate out to the master safety catch block below
        }

   } catch (error) {
        console.error("🔥 SYSTEM TRANSACTION ROLLBACK TRIGGERED:", error.message);
        
        // Safety Clean Fallback: If the master transaction structure failed mid-flight, 
        // we must explicitly clear the lock bit on the table so the terminal isn't permanently frozen
        try {
            await Table.updateOne({ _id: params.id }, { $set: { isSettling: false } });
        } catch (lockReleaseErr) {
            console.error("Critical: Failed to release table settlement lock flag", lockReleaseErr);
        }

        return NextResponse.json(new apiError(500, error.message), { status: 500 });
    }     
}

export const POST= withAuth(settleTableHandler,["manager"])