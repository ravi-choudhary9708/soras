import dbConnect from "@/libs/dbConnect";
import { apiError } from "@/utils/apiError";
import { NextResponse } from "next/server";
import Table from "@/models/table.model";
import QRCode from "qrcode";
import crypto from "crypto-js";


async function genereateTableQr(req){
  try {
      await dbConnect();
    // get user
    const {restaurantId}= req.user;
    // get table no and room

   const {tableNumber, room}= req.json();   
    //validate 
    if(!tableNumber){
        return NextResponse.json(new apiError(400,"table number is required"))
    }
    // create a permananet unguessable hash stamp for the table
     const randomSalt=crypto.randomBytes(4).toString("hex");
    const masterQrCode=`soras_${restaurantId}_t${tableNumber}_${randomSalt}`;
    // build the target deployment routing url
    const baseStoreFrontUrl=process.env.STORE_FRONT_URL;
    const permanentBaseFrontUrl=`${baseStoreFrontUrl}/scan/${masterQrCode}`;

    // Transpile vector data link matrix array into shareable image data assets
        const base64ImageString = await QRCode.toDataURL(permanentBaseFrontUrl, {
            errorCorrectionLevel: 'H',
            margin: 4,
            width: 350
        });

  const provisionedTable= await Table.findOneAndUpdate(
    { restaurantId, tableNumber },
    { masterQrCode, 
    qrCodeUrl: base64ImageString,
       room,
       status:"free",
       sessionToken:null,
       sessionExpiresAt:null
       },
    { new: true, upsert: true }
  );
    
return NextResponse.json(new apiResponse(201,provisionedTable,"Table QR code generated successfully"),{status:201});


  

  } catch (error) {
    console.error("Error generating QR code:", error);
    return NextResponse.json(new apiError(500,"Failed to generate QR code"));
  }
}