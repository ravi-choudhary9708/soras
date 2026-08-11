import dbConnect from "@/libs/dbConnect";
import { Table } from "@/models/table.model";
import { apiError } from "@/utils/apiError";
import { apiResponse } from "@/utils/apiResponse";
import { withAuth } from "@/utils/withAuth";
import { NextResponse } from "next/server";

async function listTables(req) {
    try {
        await dbConnect();
        const { restaurantId } = req.user;
        const tables = await Table.find({ restaurantId }).sort({ tableNumber: 1 });
        return NextResponse.json(new apiResponse(200, tables, "Tables fetched successfully"), { status: 200 });
    } catch (error) {
        console.error("Error fetching tables:", error);
        return NextResponse.json(new apiError(500, "Error fetching tables"));
    }
}

export const GET = withAuth(listTables, ["manager", "staff"]);
