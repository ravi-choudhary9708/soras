import dbConnect from "@/libs/dbConnect";
import { Order } from "@/models/order.model";
import { apiError } from "@/utils/apiError";
import { apiResponse } from "@/utils/apiResponse";
import { withAuth } from "@/utils/withAuth";
import { NextResponse } from "next/server";


async function serveOrderHandler(req,{params}){
   try {
     await dbConnect();
    const {restaurantId}= req.user;
    const {orderId}= params;

    if(!orderId){
        return NextResponse.json(new apiError(400,"order not found"))
    };

    const updatedOrder= await Order.findOneAndUpdate(
        {_id:orderId,restaurantId,orderStatus:"ready"},
        {$set:{orderStatus:"served"}},
        {new:true}
    );

    if(!updatedOrder){
        return NextResponse.json(new apiError(400,"order not found in kitchen queue"))
    };

    return NextResponse.json(new apiResponse(200,updatedOrder,"order served succesfully"));
   } catch (error) {
    return NextResponse.json(new apiError(400,error.message || "internal server error"))
   }
}

export const PUT= withAuth(serveOrderHandler,["staff","manager"])