import dbConnect from "@/libs/dbConnect";
import { Order } from "@/models/order.model";
import { apiError } from "@/utils/apiError";
import { apiResponse } from "@/utils/apiResponse";
import { withAuth } from "@/utils/withAuth";
import { NextResponse } from "next/server";


async function makeOrderReadyHandler(req,{params}){
   try {
     await dbConnect();
    const {restaurantId}= req.user;
    const {orderId}= params;

    if(!orderId){
        return NextResponse.json(new apiError(400,"order not found"))
    };

    const readyOrder= await Order.findOneAndUpdate(
        {_id:orderId,restaurantId,orderStatus:"preparng"},
        {$set:{orderStatus:"ready"}},
        {new:true}
    );

    if(!readyOrder){
        return NextResponse.json(new apiError(400,"order not found"))
    };

    return NextResponse.json(new apiResponse(200,readyOrder,"order served succesfully"));
   } catch (error) {
    return NextResponse.json(new apiError(400,error.message || "internal server error"))
   }
}

export const PUT= withAuth(makeOrderReadyHandler,["chef","manager"])