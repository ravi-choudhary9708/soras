import dbConnect from "@/libs/dbConnect";
import { Order } from "@/models/order.model";
import { apiError } from "@/utils/apiError";
import { apiResponse } from "@/utils/apiResponse";
import { withAuth } from "@/utils/withAuth";
import { NextResponse } from "next/server";



async function verifyOrder(req,{params}){
    try {
        await dbConnect();
        const { orderId } = await params;
        const restaurantId=req.user.restaurantId;
        const staffId=req.user._id;

        const approvedOrder= await Order.findOneAndUpdate(
            {
                _id:orderId,
                restaurantId,
                isVerified:false
            
            },
            {
                $set:{
                    isVerified:true,
                    isVerifiedBy:staffId,
                    orderStatus:"preparing"
                }
            },
            {new:true}
        );

        if(!approvedOrder){
            return NextResponse.json(new apiError(404,"pending order not found or it is approved by different staff"));

        }

        return NextResponse.json(new apiResponse(
            201,
            approvedOrder,
            "order approved successfull"
        ),{status:201});
    } catch (error) {
        console.log("error during verification of order:", error);
        return NextResponse.json(new apiError(500,error.message || " error during verification of order"));


    }
}

export const PATCH= withAuth(verifyOrder,["staff","manager"])