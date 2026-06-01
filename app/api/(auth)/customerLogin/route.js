

import dbConnect from "@/libs/dbConnect";
import { User } from "@/models/user.model";
import { Customer } from "@/models/customer.model";
import { apiError } from "@/utils/apiError";
import { apiResponse } from "@/utils/apiResponse";
import { generateAccessAndRefreshToken } from "@/utils/generateAccessAndRefreshToken";

import { NextResponse } from "next/server";



export async function POST(req){
  try {
    await dbConnect()
      const {email, phone, password}=await req.json();
    if(!(email || phone)){
            return NextResponse.json(new apiError(401,"email or phone is required"))
    }
    const customer= await Customer.findOne({
         $or: [{phone},{email}]
    });
    

    if(!customer){
        return NextResponse.json(new apiError(401,"customer not found"));

    }

    const isPasswordCorrect=await customer.isPasswordCorrect(password);

    if(!isPasswordCorrect){
        return NextResponse.json(new apiError(401,"password not correct"));
 
    }

    const accessToken= await customer.generateAccessToken();
    const refreshToken= await customer.generateRefreshToken();  
    if(!accessToken || !refreshToken){
         return NextResponse.json(new apiError(401,"token generation failed"));
    }

    const loggedInUser=await Customer.findById(customer._id).select("-password -refreshToken");
    if(!loggedInUser){
        return NextResponse.json(new apiError(401,"customer not found after login"));
    }

    const cookiesOptions={
        httpOnly: true,
            secure:true, // true in production, false on localhost
            sameSite: "strict",
            path: "/"
    }

    const response = NextResponse.json(
    new apiResponse(201, { user: loggedInUser }, "user logged in"), 
    { status: 201 }
);
      
    // Bake both tokens directly into the browser cookie storage vault at login time
        response.cookies.set("accessToken", accessToken, { ...cookiesOptions, maxAge: 30*60 * 60 }); // 15 mins
        response.cookies.set("refreshToken", refreshToken, { ...cookiesOptions, maxAge: 365 * 24 * 60 * 60 }); // 10 days

        return response;
  } catch (error) {
    console.log("login error", error);
    return NextResponse.json(new apiError(500, "Login processing crashed"), { status: 500 });
    
  }
}