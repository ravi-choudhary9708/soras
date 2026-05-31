import dbConnect from "@/libs/dbConnect";
import { User } from "@/models/user.model";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { apiResponse } from "./apiResponse";
import { apiError } from "./apiError";

// dbConnet
// get toke
// verfy token
// find user
// populate user to req

export function withAuth(handler,allowedRole){
    return async(req, res)=>{
        try {
            await dbConnect();

            const token= req.cookies?.get("accessToken")?.value || req.headers.get("Authorization").replace("Bearer ","");
             if(!token){
                return NextResponse.json(new apiResponse(401,null,"Authentication token missed"),{status:401});
             }

             const decodedToken= await jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);

             const user= await User.findById(decodedToken?._id).select("-password -refreshToken");
             if(!user){
                 return NextResponse.json(new apiResponse(401,null,"invalid session user"),{status:401});

             }

             req.user=user;
             if(allowedRole && user.role !== allowedRole){
                return NextResponse.json(new apiResponse(401,null,"unauthorized"),{status:401});
             }  
             return await handler(req,res);

        } catch (error) {
          return NextResponse.json(
                new apiResponse(401, null, "Session expired or invalid"), 
                { status: 401 }
          )
        }
    }
}