

import dbConnect from "@/libs/dbConnect";
import { Table } from "@/models/table.model";
import { apiError } from "@/utils/apiError";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { Order } from "@/models/order.model";
import { apiResponse } from "@/utils/apiResponse";

export async function POST(req){
try {
    await dbConnect();
    // get details
    const {restaurantId,tableNumber,sessionToken, items}=await req.json();
    if(!restaurantId || !tableNumber || !sessionToken || !items || items.length===0){
        return NextResponse.json(new apiError(400,"all fields are required"));
    }

    // find table
    const activeTable= await Table.findOne({restaurantId,tableNumber});
    if(!activeTable || activeTable.status!=="occupied" || activeTable.sessionToken!==sessionToken){
        return NextResponse.json(new apiError(
            401,
            "your dining session is expired or invalid , please scan qr code again"
        ));
    }
    
    // check for expiry-> outsider cant orser afetr expire
    if(new Date()> activeTable.sessionExpiresAt){
        return NextResponse.json(new apiError(
            401,
            "your session token is expired , please rescan the  qr "
        ));
    }

    // check who is ordeing
    let role="customer";
    let authenticatedUserId=null;

    const token= req.cookies?.get("accessToken")?.value || req.headers.get("Authorization")?.replace("Bearer ","");

    if(token){
        try {
            const decodedToken= jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
            role=decodedToken.role;
            authenticatedUserId=decodedToken._id;
        } catch (error) {
            role="customer";
        }
    }

    const processedItems= items.map(item=>({
        menuItemId:item.menuItemId,
        quantity:item.quantity,
        name:item.name,
        price:item.price || null


    }))

    // if its staff send directly
    // if its customer make it pending

    const isStaffUser=(role== "staff" || role=="manager");
    const orderPayload={
        restaurantId,
        tableId:activeTable._id,
        tableNumber:activeTable.tableNumber,
        items:processedItems,
        customerId:!isStaffUser?authenticatedUserId:null,
        isVerifiedBy:isStaffUser?authenticatedUserId:null,
        isVerifiedBy:isStaffUser,
        orderStatus:isStaffUser?"preparing":"pending",
        PaymentStatus:"open",
        synced:false

    }

    // save to db
    const newOrder= await Order.create(orderPayload);

    return NextResponse.json(
        new apiResponse(201,newOrder,"order placed"),
        {status:201}
    );



    
} catch (error) {
    console.log("placed order error:", error);
    return NextResponse.json(new apiError(500,error.message ||"internal server error"));
}
}