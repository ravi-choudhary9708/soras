

// join the paymment collection with restaurant collection and get the payment status for the current billing cycle for the restaurant
// flatten the joined restaurantdetails array into a flat onj
// group all record together into a single object with restaurant details and payment details
// ->_id,totalTransaction,totalrevenueApproved,totalRevenueRejected,restaurantDetails
// gather an array list of all res currently in trial and pending state
// project id:0,totalTransaction:1,totalrevenueApproved:1,totalRevenueRejected:1,restaurantDetails:1
// if no record found return empty object
import { Payment } from "@/models/payment.model";
import { Restaurant } from "@/models/restaurant.model";
import dbConnect from "@/libs/dbConnect";
import { apiError } from "@/utils/apiError";
import { NextResponse } from "next/server";
import { withAuth } from "@/utils/withAuth";
import { apiResponse } from "@/utils/apiResponse";

async function getPaymentStatus(req){
    try {
        await dbConnect();
        const currentUser= req.user;
        const stats= await Payment.aggregate([
            {
            $lookup:{
                from:"restaurants",
                localField:"restaurantId",
                foreignField:"_id",
                as:"restaurantDetails"
            }
        },
        {
            $unwind:"$restaurantDetails"
        },
        {
            $group:{
                _id:null,
                totalTransaction:{$sum:1},
                totalRevenueApproved:{$sum:{$cond:[{$eq:["$status","approved"]},100,0]}},
                totalRevenueRejected:{$sum:{$cond:[{$eq:["$status","rejected"]},100,0]}},
                totalRevenuePending:{$sum:{$cond:[{$eq:["$status","pending"]},100,0]}},
            }
        },
        {
            pendingReviewList:{
                $push:{
                    $cond:[
                        {$eq:["$status","pending"]},
                        {
                            paymentId:"$_id",
                            restaurantId:"$restaurantId",
                            restaurantName:"$restaurantDetails.name",
                            billingCycle:"$billingCycle",
                        },
                        "$$REMOVE"
                    ]
                }
            }
        },
        {
            $project:{
                _id:0,
                totalTransaction:1,
                totalRevenueApproved:1,
                totalRevenueRejected:1,
                totalRevenuePending:1,
                pendingReviewList:{
                    $filter:{
                        input:"$pendingReviewList",
                        as:"item",
                        cond:{$ne:["$$item",null]}
                    }
                }
            }
        }
    ]);

    // if no record found return empty object
    const finalStats=stats.length>0? stats[0]:{
        totalTransaction:0,
        totalRevenueApproved:0,
        totalRevenueRejected:0,
        totalRevenuePending:0,
        pendingReviewList:[]
    };
    return NextResponse.json(new apiResponse(200,finalStats,"Payment status fetched successfully"));
    } catch (error) {
        console.log("get payment status error", error);
        return NextResponse.json(new apiError(500,error.message || "internal server error"));
       
    }
}

export const GET= withAuth(getPaymentStatus,"admin");