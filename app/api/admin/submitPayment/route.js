// receive data as image->validate
// find restaurant->validtae
// upload to cloudinary
// save payment details with image url in db
// return res   

import { NextResponse } from "next/server";
import {Restaurant} from "@/models/restaurant.model";
import { Payment } from "@/models/payment.model";
import dbConnect from "@/libs/dbConnect";
import { apiError } from "@/utils/apiError";
import { withAuth } from "@/utils/withAuth";
import { apiResponse } from "@/utils/apiResponse";


 async function submitPayment(req){
    try {
        await dbConnect();
        const currentUser= req.user;
        console.log("current user in submit payment", currentUser);
        if(!currentUser ){
            return NextResponse.json(new apiError(401,"unauthorized"));
        }
        const {screenshotUrl,cloudinaryPublicId, note}= await req.json();
        

        if(!screenshotUrl || !cloudinaryPublicId){
            return NextResponse.json(new apiError(401,"payment screenshot is required"));
        }
        const restaurant= await Restaurant.findById(currentUser.restaurantId);
        if(!restaurant){
            return NextResponse.json(new apiError(404,"restaurant not found"));
        }
      
        const now= new Date();
        const currentBillingCycle= new Date(now.getFullYear(), now.getMonth(), 1);
        console.log("current billing cycle in submit payment", currentBillingCycle);
        const existingPayment= await Payment.findOne({
            restaurantId: restaurant._id,
            billingCycle: currentBillingCycle,
            status:{$in:["pending","approved"]}
        });
        console.log("existing payment in submit payment", existingPayment);
        
        if(existingPayment){
            return NextResponse.json(new apiError(400,"payment for current billing cycle already exists"));
        }
        const payment= await Payment.create({
            restaurantId: restaurant._id,
            managerId: currentUser._id,
            billingCycle: currentBillingCycle,
            screenshotUrl,
            status: "pending",
            cloudinaryPublicId: cloudinaryPublicId,
            note: note
        });
console.log("created payment in submit payment", payment);

        return NextResponse.json(new apiResponse(201,"payment submitted successfully"));

    } catch (error) {
        console.log("submit payment error", error);
        return NextResponse.json(new apiError(500,error.message || "internal server error"));   
    }
}

export const POST= withAuth(submitPayment,"manager");
