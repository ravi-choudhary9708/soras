// get paymentId, status and rejection resion if rejected
// validate 
// limit state modification to clean business logic in route handler
// find payment
// validate payment exist and pending state
// update payment status and rejection reason if rejected
// return res
import { Payment } from "@/models/payment.model";
import { apiError } from "@/utils/apiError";
import { NextResponse } from "next/server";
import dbConnect from "@/libs/dbConnect";
import { withAuth } from "@/utils/withAuth";
import { apiResponse } from "@/utils/apiResponse";
async function verifyPayment(req){
  try {
      await dbConnect();
    // implementation will be in next phase when we will implement payment verification by admin
   const {paymentId, status, rejectionReason}= await req.json();

   if(!paymentId || !status || (status==="rejected" && !rejectionReason)){
    return NextResponse.json(new apiError(400,"paymentId, status and rejection reason if rejected are required"));
   }
    if(!["approved","rejected"].includes(status)){
    return NextResponse.json(new apiError(400,"Invalid status. Must be 'approved' or 'rejected'"));
   }    
   const payment= await Payment.findById(paymentId);
   if(!payment){
    return NextResponse.json(new apiError(404,"payment not found"));
   }
    if(payment.status!=="pending"){
    return NextResponse.json(new apiError(400,"Only pending payments can be verified"));
   }
    payment.status=status;
    payment.verifiedAt= new Date();
    payment.rejectionReason= status==="rejected"? rejectionReason : undefined;
    await payment.save();

    if(status==="approved"){
        const expiryDate= new Date();
        expiryDate.setMonth(expiryDate.getMonth()+1);
        const restaurant= await Restaurant.findByIdAndUpdate(payment.restaurantId,{
            isAccountActive:true,
            planExpiresAt: expiryDate,
        },{new:true});
        };
    if(status==="rejected"){
        const restaurant= await Restaurant.findByIdAndUpdate(payment.restaurantId,{
            isAccountActive:false,
        },{new:true});
    }

         return NextResponse.json(new apiResponse(200,{status:restaurant.status},"Payment verified successfully"));
  } catch (error) {
    return NextResponse.json(new apiError(500,"An error occurred while verifying the payment"));
  }
    }

    export const POST= withAuth(verifyPayment,"admin");
   

