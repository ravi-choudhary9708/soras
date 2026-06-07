import dbConnect from "@/libs/dbConnect";
import { Order } from "@/models/order.model";
import { Table } from "@/models/table.model";
import { apiError } from "@/utils/apiError";
import { apiResponse } from "@/utils/apiResponse";
import { withAuth } from "@/utils/withAuth";
import { NewspaperIcon } from "lucide-react";
import { NextResponse } from "next/server";


async function paymentAndClearTable(req){
   try {
     await dbConnect()
    const {orderId,tableId,paymentMode}= req.json();
    if(!orderId || !tableId){
        return NextResponse.json(new apiError(400,"orderId and TableId is requires"));
    }

    const finalizedOrder= await Order.findOneAndUpdate(
        {_id:orderId,restaurantId:req.user.restaurantId},
        {
            $set:{
                PaymentStatus:paid,
                paymentMode:paymentMode||"cash",
                orderStatus:"served"
            }
        },
        {new:true}
    );

    if(!finalizedOrder){
        return NextResponse.json(new apiError(501,"active order not found for this res context"));

    }

    // clear the table
    await Table.findOneAndUpdate(
        {_id:tableId,restaurantId:req.user.restaurantId},
        {
            $set:{
                status: "free",
                sessionToken: null,
                sessionExpiresAt: null
            }
        }
    )

    return NextResponse.json(
        new apiResponse(201,finalizedOrder,"payment setteled successfull and table cleared"),{status:201}
    )
   } catch (error) {
    console.log("payment settle err:", error);
    return NextResponse.json(new apiError(500,"internal server error during payment and settele"));
   }
}

export const POST= withAuth(paymentAndClearTable,["staff","manager"]);