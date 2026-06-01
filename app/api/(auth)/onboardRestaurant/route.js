// get details->validate
// find user
// check for existing user and restuarant->validtae 
// make trial expiray
// create res
// create user
// create res data
// return res

import dbConnect from "@/libs/dbConnect";
import { Restaurant } from "@/models/restaurant.model";
import { User } from "@/models/user.model";
import { apiError } from "@/utils/apiError";
import { apiResponse } from "@/utils/apiResponse";
import { NextResponse } from "next/server";


export async function POST(req){
    await dbConnect();
try {
    const {restaurantName,restaurantUpiId,restaurantPhone,email,username,fullName,password}=await req.json();
    const role="manager";

    if([username,restaurantName,restaurantUpiId,email,restaurantPhone,fullName,password].some(feild=>!feild || feild.trim()=="")){
        console.log("missing feilds", {username,restaurantName,restaurantUpiId,email,restaurantPhone,fullName,password});
        return NextResponse.json(new apiError(401,"all feild is required"));
    }

    const existingUser= await User.findOne({$or:[{username},{email}]});
    const existingRestaurant= await Restaurant.findOne({phone:restaurantPhone});

    if(existingUser || existingRestaurant){
        console.log("user or restaurant already exists", {existingUser, existingRestaurant});
        return NextResponse.json(new apiError(401,"restaurant or user already exists"));
    }

    const trialExpiry=new Date();
    trialExpiry.setDate(trialExpiry.getDate()+14);
    const graceDuration = 24 * 60 * 60 * 1000;
    const graceExpiresAt = new Date(trialExpiry.getTime() + graceDuration);

    const restaurant= await Restaurant.create({
        name:restaurantName,
        phone:restaurantPhone,
        upiId:restaurantUpiId,
        plan:"trial",
        graceExpiresAt:graceExpiresAt,
        planExpiresAt:trialExpiry,
    });

    // create user
    const manager= await User.create({
        username:username,
        email:email,
        phone:restaurantPhone,
        fullName,
        password,
        role,
        restaurantId:restaurant._id,
    });

    const createdManager= await User.findById(manager._id).select("-password -refreshToken");
    const createdRestaurant= await Restaurant.findById(restaurant._id);
    
    if(!createdRestaurant || !createdManager){
        console.log("creation failed", {createdManager, createdRestaurant});
        return NextResponse.json(new apiError(501,"no restaurant and manager found"));
    }



    return NextResponse.json(new apiResponse(201,{user:manager, restaurant:restaurant},"restaurant created successfully"),{status:201});
}catch (error) {
    console.log("onboarding error", error);
    return NextResponse.json(new apiError(500,error.message || "internal server error"));
}
}