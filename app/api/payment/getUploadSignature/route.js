// timestamps, folder-> cryptographic sgnature
// send the signature and folder name to the client, client can use it to upload directly to cloudinary from the frontend without going through our backend, this way we can save bandwidth and also reduce the load on our server

import { NextResponse } from "next/server";
import { withAuth } from "@/utils/withAuth";
import { apiError } from "@/utils/apiError";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,  
});

async function getUploadSignature(req){
    try {
        const timestamp= Math.round(Date.now()/1000);
        const folderName= `soras/payments/${req.user.restaurantId}`;
        const signature= cloudinary.utils.api_sign_request({timestamp, folder: folderName}, process.env.CLOUDINARY_API_SECRET);
        return NextResponse.json({
            timestamp,
            folderName,
            signature,
            apiKey: process.env.CLOUDINARY_API_KEY,
            cloudName: process.env.CLOUDINARY_CLOUD_NAME
        });
    } catch (error) {
        console.error("Error generating upload signature:", error);
        return NextResponse.json(new apiError(500, "Failed to generate upload signature")); 
    }
}

export const POST= withAuth(getUploadSignature, "manager");
    
       