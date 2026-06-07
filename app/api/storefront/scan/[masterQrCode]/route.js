import { apiResponse } from "@/utils/apiResponse";
import { NextResponse } from "next/server";
import dbConnect from "@/libs/dbConnect";
import Table from "@/models/table.model";
import MenuItem from "@/models/menuItem.model";
import crypto from "crypto-js";
import { apiError } from "@/utils/apiError";


export async function GET(req,{params}){
    try {
        await dbConnect();
        const {masterQrCode}=params;
        const now=new Date();

        // attempt to claim the table only if it is completely free and the old session has expired
        const claimedTable= await Table.findOneAndUpdate(
            {
                masterQrCode,
                status:"free",
                $or:[
                    { sessionExpiresAt: { $lte: now } },
                    { sessionExpiresAt: null }
                ]
            },
            {
                $set:{
                    status:"occupied",
                    sessionToken:crypto.randomUUID(),
                    sessionExpiresAt:new Date(now.getTime() + 1*60*60*1000) // 30 mins session validity
                },
                
            },
            {new:true}
        );
        // race conndition check - if no table was claimed, it means it is currently occupied by another user or someone else won the race condition to claim it just before
        if(!claimedTable){
             const table=await Table.findOne({masterQrCode});
            if(!table){
                return NextResponse.json(new apiError(404,"Table not found"),{status:404});
            }

            if(table.status==="occupied" && table.sessionExpiresAt > now && table.sessionToken){
                const menu = await MenuItem.find({ restaurantId: table.restaurantId, isAvailable: true });
                return NextResponse.json(new apiResponse(200,{
                    restaurantId:table.restaurantId,
                    tableNumber:table.tableNumber,
                    sessionToken:table.sessionToken,
                    menu
                },"Rejoined active session successfully"),{status:200});
              

             }
             return NextResponse.json(new apiError(409,"This table session is currently locked or invalid"),{status:409});

             // This execution branch means this request successfully initialized/rotated the table session
        }
        // This execution branch means this request successfully initialized/rotated the table session
        const menu = await MenuItem.find({ restaurantId: claimedTable.restaurantId, isAvailable: true });
        return NextResponse.json(new apiResponse(200,{
            restaurantId:claimedTable.restaurantId,
            tableNumber:claimedTable.tableNumber,
            sessionToken:claimedTable.sessionToken,
            menu
        },"Table claimed successfully"),{status:200});
            
    } catch (error) {
        console.error("Error claiming table:", error);
        return NextResponse.json(new apiError(500,"Failed to claim table"));
    }
}