import dbConnect from "@/libs/dbConnect";
import { Order } from "@/models/order.model";
import { apiError } from "@/utils/apiError";
import { apiResponse } from "@/utils/apiResponse";
import { NextResponse } from "next/server";


async function getPendingOrder(req){
   try {
     await dbConnect();
    const {restaurantId}=req.json();
    if(!restaurantId){
        return NextResponse.json(new apiError(401,"restaurantId is required"))
    }

    const pendingOrder= await Order.find({
        restaurantId,
        isVerified:false,
        orderStatus:"pending",
    }).sort({createdAt:1});

    if(!pendingOrder){
        return NextResponse.json(new apiError(401,"no pending order"))
    }

    const now= new Date();
    const operationalTray = pendingOrders.map(order => {
            const orderAgeMs = now.getTime() - new Date(order.createdAt).getTime();
            const minutesOld = Math.floor(orderAgeMs / 60000);

            return {
                ...order.toObject(),
                minutesOld
            };
        });

    return NextResponse.json(new apiResponse(201,pendingOrder,"fetched order successfully"));
   } catch (error) {
    console.log("error during getting order:",error.message);
    return NextResponse.json(new apiError(501,error.message||"intenal server error"))
   }
}