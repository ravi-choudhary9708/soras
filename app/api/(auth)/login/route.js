import { User } from "@/models/user.model";
import { apiError } from "@/utils/apiError";
import { apiResponse } from "@/utils/apiResponse";
import { generateAccessAndRefreshToken } from "@/utils/generateAccessAndRefreshToken";

import { NextResponse } from "next/server";


export async function POST(req){
  try {
      const {email, username, password}=await req.json();
    if(!(email || username)){
            return NextResponse.json(new apiError(401,"username or email is required"))
    }
    const user= await User.findOne({
         $or: [{username},{email}]
    });

    if(!user){
        return NextResponse.json(new apiError(401,"user not found"));

    }

    const isPasswordCorrect=await user.isPasswordCorrect(password);

    if(!isPasswordCorrect){
        return NextResponse.json(new apiError(401,"password not correct"));
 
    }

    const tokens= await generateAccessAndRefreshToken(user._id);
    if(!tokens){
         return NextResponse.json(new apiError(401,"token generation failed"));
    }
    const {accessToken,refreshToken}=tokens;

    const loggedInUser=await User.findById(user._id).select("-password -refreshToken");
    if(!loggedInUser){
        return NextResponse.json(new apiError(401,"user not found after login"));
    }

    const cookiesOptions={
        httpOnly: true,
            secure:true, // true in production, false on localhost
            sameSite: "strict",
            path: "/"
    }

    const response=  NextResponse.json(new apiResponse(201,{user:loggedInUser},"user logged in"),{status:201});
      
    // Bake both tokens directly into the browser cookie storage vault at login time
        response.cookies.set("accessToken", accessToken, { ...cookiesOptions, maxAge: 15 * 60 }); // 15 mins
        response.cookies.set("refreshToken", refreshToken, { ...cookiesOptions, maxAge: 10 * 24 * 60 * 60 }); // 10 days

        return response;
  } catch (error) {
    return NextResponse.json(new apiError(500, "Login processing crashed"), { status: 500 });
    
  }
}