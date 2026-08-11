import dbConnect from "@/libs/dbConnect";
import { Table } from "@/models/table.model";
import { apiError } from "@/utils/apiError";
import { apiResponse } from "@/utils/apiResponse";
import { withAuth } from "@/utils/withAuth";
import { NextResponse } from "next/server";

async function deleteTable(req, { params }) {
    try {
        await dbConnect();
        const { id } = params;
        const { restaurantId } = req.user;

        const deleted = await Table.findOneAndDelete({ _id: id, restaurantId });
        if (!deleted) {
            return NextResponse.json(new apiError(404, "Table not found or not owned by this restaurant"));
        }

        return NextResponse.json(new apiResponse(200, { id }, "Table deleted successfully"));
    } catch (error) {
        console.error("Error deleting table:", error);
        return NextResponse.json(new apiError(500, "Error deleting table"));
    }
}

export const DELETE = withAuth(deleteTable, ["manager"]);
