import { NextResponse } from "next/server";
import dbConnect from "@/libs/dbConnect";
import { Table } from "@/models/table.model";
import { withAuth } from "@/utils/withAuth";
import { apiResponse } from "@/utils/apiResponse";
import { apiError } from "@/utils/apiError";

async function getTablesStatusHandler(req) {
    try {
        await dbConnect();
        const { restaurantId } = req.user;

        // Fetch all physical table configurations for this tenant
        const tablesGrid = await Table.find({ restaurantId }).sort({ tableNumber: 1 });

        return NextResponse.json(
            new apiResponse(200, tablesGrid, "Live floor telemetry matrix synchronized."),
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json(new apiError(500, error.message), { status: 500 });
    }
}

export const GET = withAuth(getTablesStatusHandler, ["staff", "manager"]);