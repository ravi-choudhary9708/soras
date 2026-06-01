import { NextResponse } from "next/server";
import dbConnect from "@/libs/dbConnect";
import { Customer } from "@/models/customer.model";
import { apiError } from "@/utils/apiError";
import { apiResponse } from "@/utils/apiResponse";

export async function POST(req){
 try {
    await dbConnect();
    // get req body
    const {email,phone,password,name,whatsappOptIn}=await req.json();
    // validate feilds
    if([email,phone,password,name].some(feild=>!feild || feild.trim()=="")){
        return NextResponse.json(new apiError(401,"all feild is required"));
    }
    // check for existing user
    const existingCustomer= await Customer.findOne({$or:[{email},{phone}]});
    if(existingCustomer){
        return NextResponse.json(new apiError(401,"customer already exists"));
    }
    // clean phone number
    const cleanPhone=phone.replace(/\D/g, '');
     if(cleanPhone.length < 10){
        return NextResponse.json(new apiError(401,"invalid phone number"));
     };
    //  create customer
    const customer= await Customer.create({
        email,
        phone,
        password,
        name:name.trim(),
        whatsappOptIn:whatsappOptIn || false,
        visitedRestaurants:[],
        orderHistory:[],
    });
  
    // generate token
        const accessToken= await customer.generateAccessToken();
         if(!accessToken){
            return NextResponse.json(new apiError(401,"token generation failed"));
        }
        const refreshToken= await customer.generateRefreshToken();
         customer.refreshToken=refreshToken;
         await customer.save({validateBeforeSave:false});

         const newCustomer= await Customer.findById(customer._id).select("-password -refreshToken");
         if(!newCustomer){
            return NextResponse.json(new apiError(401,"customer not found after registration"));
        }

    

       
    const res= NextResponse.json(new apiResponse(201,{customer:newCustomer}, "customer registered successfully"),{status:201});
   

     const cookiesOptions={
            httpOnly: true,
            secure:true, // true in production, false on localhost
            sameSite: "strict",
        };
    res.cookies.set("accessToken", accessToken, { ...cookiesOptions, maxAge: 30*24*60*60 }); // 30 days
    res.cookies.set("refreshToken", refreshToken, { ...cookiesOptions, maxAge: 365*24*60*60 }); // 30 days

    return res;
 } catch (error) {
    console.log("customer registration error", error);
    return NextResponse.json(new apiError(500,"failed to create customer"));
 }
}