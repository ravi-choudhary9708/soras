import dbConnect from "@/libs/dbConnect";
import { apiError } from "@/utils/apiError";
import { NextResponse } from "next/server";
import { Table } from "@/models/table.model";
import QRCode from "qrcode";
import crypto from "crypto";
import { apiResponse } from "@/utils/apiResponse";
import { withAuth } from "@/utils/withAuth";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


async function generateTableQr(req) {
  try {
    await dbConnect();
    // get user
    const { restaurantId } = req.user;
   
    if (!restaurantId) {
      return NextResponse.json(new apiError(400, "please login"))
    }
    // get table no and room

    const { tableNumber, room } = await req.json();
    //validate 
    if (!tableNumber) {
      return NextResponse.json(new apiError(400, "table number is required"))
    }
    // create a permananet unguessable hash stamp for the table
    const randomSalt = crypto.randomBytes(4).toString("hex");
    const masterQrCode = `soras_${restaurantId}_t${tableNumber}_${randomSalt}`;
    // build the target deployment routing url
    const baseStoreFrontUrl = process.env.STORE_FRONT_URL;
    const permanentBaseFrontUrl = `${baseStoreFrontUrl}/scan/${masterQrCode}`;

    console.log("base front url:",permanentBaseFrontUrl);

    // Transpile vector data link matrix array into shareable image data assets
    const base64ImageString = await QRCode.toDataURL(permanentBaseFrontUrl, {
      errorCorrectionLevel: 'H',
      margin: 4,
      width: 350
    });


    // upload to cloudinary
    const result = await cloudinary.uploader.upload(base64ImageString, {
      folder: "restaurant-qr",
      public_id: `${restaurantId}_table_${tableNumber}`
    });

    if (!result) {
      return NextResponse.json(new apiError(401, "cloudinary upload failed"));
    }

    const provisionedTable = await Table.findOneAndUpdate(
      { restaurantId, tableNumber },
      {
        masterQrCode,
        qrCodeUrl: result.secure_url,
        qrPublicId: result.public_id,
        room,
        status: "free",
        sessionToken: null,
        sessionExpiresAt: null
      },
      { new: true, upsert: true }
    );

    return NextResponse.json(new apiResponse(201, provisionedTable, "Table QR code generated successfully"), { status: 201 });




  } catch (error) {
    console.error("Error generating QR code:", error);
    return NextResponse.json(new apiError(500, "Failed to generate QR code"));
  }
}

export const POST = withAuth(generateTableQr, ["manager"])