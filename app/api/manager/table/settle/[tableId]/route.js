import dbConnect from "@/libs/dbConnect";
import { DailySummary } from "@/models/dailySummary";
import { Order } from "@/models/order.model";
import { Table } from "@/models/table.model";
import { apiError } from "@/utils/apiError";
import { apiResponse } from "@/utils/apiResponse";
import { withAuth } from "@/utils/withAuth";
import { NextResponse } from "next/server";


async function settleTableHandler(req,{params}){
   try {
     await dbConnect();
    const {tableId}= params;
    const {restaurantId}= req.user;
    const {paymentMode}= await req.json();

    const table = await Table.findOne({_id:tableId,restaurantId});
    if(!table || table.status==="free" || !table.sessionToken){
        return NextResponse.json(new apiError(400,"this table is free or session token not found"),{status:404});
    };

    const sessionOrder= await Order.find({
        restaurantId,
        tableNumber:table.tableNumber,
        sessionToken:table.sessionToken,
        orderStatus:"served",
    });

    if(sessionOrder.length===0){
        return NextResponse.json(new apiError(400,"no served order found for this session"),{status:400});
    }

    // loop through all order to calculate the grand total billand prep top items analytics
    let tableGrandTotal=0;
    const itemAggregator={} //dynamic map to group itmes quantity and cash loops

    for(let order of sessionOrder){
        tableGrandTotal+=order.totalAmount;

        // Drill down into items to calculate individual totals for DailySummary topItems analytics
            for (let item of order.items) {
                if(!itemAggregator[item.menuItemId]){
                    itemAggregator[item.menuItemId]={
                        menuItemId:item.menuItemId,
                        name:item.name,
                        totalQuantitySold:0,
                        totalRevenueGenerate:0,
                    };

                };
                itemAggregator[item.menuItemId].totalQuantitySold+=item.quantity;
                itemAggregator[item.menuItemId].totalRevenueGenerate+=(item.price * item*quantity);
            }
    }

    // 4. Determine whether the money goes to totalCash or toatlUpi fields based on your schema
    let cashIncrement=0;
    let upiIncrement=0;

    if(paymentMode.toLowerCase()==="cash"){
        cashIncrement=tableGrandTotal;
    }else if(paymentMode.toLowerCase()==="upi"){
        upiIncrement+=tableGrandTotal
    }else{
        return NextResponse.json(new apiError(400,"invalid payment method, use cash or upi"));
    }

    // 5. Generate normalized timestamp boundary for today's analytics date index block
        const today = new Date();
        today.setHours(0,0,0,0);
      // 6. Push the calculations directly into DailySummary ledger using basic atomic increments ($inc)
        const summaryUpdate = {
            $inc:{
                totalCash:cashIncrement,
                totalUpi:upiIncrement,
                totalOrder:sessionOrder.length
            }
        }  

        const dailyDoc= await DailySummary.findOneAndUpdate(
            {restaurantId,date:today},
            summaryUpdate,
            {upsert:true, new:true}
        );

        // 7. Core Analytics Logic: Safely sync best selling dishes into your topItems subschema array
        for (let itemId in itemAggregator) {
            const currentAggregatedItem=itemAggregator[itemId];
            // If the item already exists in today's tracking list, increment its numbers inside the array
            const exactItemIndex = dailyDoc.topItems.findIndex(i => i.menuItemId.toString() === itemId);

              if(exactItemIndex>-1){
            dailyDoc.topItems[exactItemIndex].totalQuantitySold+=currentAggregatedItem.totalQuantitySold;
            dailyDoc.topItems[exactItemIndex].totalRevenueGenerate+=currentAggregatedItem.totalRevenueGenerate;

        }else{
            // If it's a completely new dish sold for the first time today, push it onto the subschema list
                dailyDoc.topItems.push(currentAggregatedItem);
        }
        }
        await dailyDoc.save();
// 8. Update all orders related to this table session from "served" to "completed" so they leave active dashboards
   await Order.updateMany(
   { restaurantId, tableNumber: table.tableNumber, sessionToken: table.sessionToken },
    { $set: { orderStatus: "completed" } }
   );

   return NextResponse.json(new apiResponse(200, {grandTotal:tableGrandTotal},`Table ${table.tableNumber} cleared out successfully! Total Bill: ₹${tableGrandTotal}`),{status:200})

   } catch (error) {
    console.log("error at settleTable", error.message);
    return NextResponse,json(new apiError(200,error.message||"internal server error"))
   }      
}

export const POST= withAuth(settleTableHandler,["manager"])