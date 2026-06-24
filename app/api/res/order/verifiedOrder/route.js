import dbConnect from "@/libs/dbConnect";
import { Order } from "@/models/order.model";
import { apiError } from "@/utils/apiError";
import { apiResponse } from "@/utils/apiResponse";
import { NextResponse } from "next/server";



async function getKitchenOrderHandler(req){
  try {
      await dbConnect();
    const {restaurantId}= req.user;

    const kitechTray= await Order.find({
        restaurantId,
        isVerified:true,
        orderStatus:"preparing",
    }).sort({updatedAt:1});

    if(!kitechTray){
        return NextResponse.json(new apiError(400,"order not found"));
    }

    return NextResponse.json(new apiResponse(200,kitechTray,"order fetched successfull"),{status:200})
    
  } catch (error) {
    console.log("error at get kitchen order:",error.message);
     return NextResponse.json(new apiError(400,error.message||"order not found"));
  }
}