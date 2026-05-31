
//loged in manager from withAuth
// validate only manager can register staff for his restaurant
// get details->validate
// find user
// check for existing user and restuarant->validtae 
// create user
// return res
import { apiError } from "@/utils/apiError";
import { NextResponse } from "next/server";
import dbConnect from "@/libs/dbConnect";
import { User } from "@/models/user.model";
import { withAuth } from "@/utils/withAuth";
import { apiResponse } from "@/utils/apiResponse";



 async function registerStaff(req){
    
try {
    await dbConnect();
    const currentUser= req.user;
    
    if(currentUser.role!="manager"||!currentUser ){
        return NextResponse.json(new apiError(401,"unauthorized"));
    }
    const {email,username,fullName,password,phone}=await req.json();

    if([username,email,phone,fullName,password].some(feild=>!feild || feild.trim()=="")){
        return NextResponse.json(new apiError(401,"all feild is required"));
    }
    const role="staff";
    const existingUser= await User.findOne({$or:[{username},{email}]});
    if(existingUser){
        return NextResponse.json(new apiError(401,"user already exists"));
    }
    const user= await User.create({
        username,
        email,
        fullName,
        password,
        phone,
        role,
        restaurantId:currentUser.restaurantId,
    });

    const createdUser= await User.findById(user._id).select("-password -refreshToken");
    if(!createdUser){
        return NextResponse.json(new apiError(500,"user creation failed"));
    }
    return NextResponse.json(new apiResponse(201,createdUser,"user created successfully"),{status:201});
}catch (error) {
    console.log("registration error", error);
    return NextResponse.json(new apiError(500,error.message || "internal server error"));
}
}

export const POST=withAuth(registerStaff ,"manager");
