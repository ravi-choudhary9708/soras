import { NextResponse } from "next/server";
import dbConnect from "@/libs/dbConnect";
import { Customer } from "@/models/customer.model";
import jwt from "jsonwebtoken";
import { apiResponse } from "@/utils/apiResponse";

// Optional auth — returns customer profile if logged in, or null if guest
// Never returns 401; always returns 200 so the storefront can show a "Guest" state
export async function GET(req) {
    try {
        const token =
            req.cookies?.get("customerAccessToken")?.value ||
            req.cookies?.get("accessToken")?.value ||
            req.headers.get("Authorization")?.replace("Bearer ", "");

        if (!token) {
            // Guest — no cookie present
            return NextResponse.json(
                new apiResponse(200, null, "guest"),
                { status: 200 }
            );
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        // Must be a customer role token
        if (decodedToken?.role !== "customer") {
            return NextResponse.json(
                new apiResponse(200, null, "guest"),
                { status: 200 }
            );
        }

        await dbConnect();
        const customer = await Customer.findById(decodedToken._id).select(
            "-password -refreshToken"
        );

        if (!customer) {
            return NextResponse.json(
                new apiResponse(200, null, "guest"),
                { status: 200 }
            );
        }

        return NextResponse.json(
            new apiResponse(200, customer, "Customer profile fetched"),
            { status: 200 }
        );
    } catch (error) {
        // Token expired or invalid — treat as guest
        return NextResponse.json(
            new apiResponse(200, null, "guest"),
            { status: 200 }
        );
    }
}
