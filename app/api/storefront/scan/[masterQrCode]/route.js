import { apiResponse } from "@/utils/apiResponse";
import { NextResponse } from "next/server";
import dbConnect from "@/libs/dbConnect";
import { Table } from "@/models/table.model";
import { MenuItem } from "@/models/menuItem.model";
import crypto from "crypto";
import { apiError } from "@/utils/apiError";


export async function GET(req, { params }) {
    try {
        await dbConnect();
        const { masterQrCode } = params;
        const now = new Date();

        // Attempt to claim the table atomically — only if free/session expired
        const claimedTable = await Table.findOneAndUpdate(
            {
                masterQrCode,
                status: "free",
                $or: [
                    { sessionExpiresAt: { $lte: now } },
                    { sessionExpiresAt: null }
                ]
            },
            {
                $set: {
                    status: "occupied",
                    sessionToken: crypto.randomBytes(16).toString("hex"),
                    sessionExpiresAt: new Date(now.getTime() + 1 * 60 * 60 * 1000) // 1 hour session
                },
            },
            { new: true }
        );

        // Race condition check — no table was claimed
        if (!claimedTable) {
            const table = await Table.findOne({ masterQrCode });
            if (!table) {
                return NextResponse.json(new apiError(404, "Table not found"), { status: 404 });
            }

            if (table.status === "occupied" && table.sessionExpiresAt > now && table.sessionToken) {
                const menu = await MenuItem.find({ restaurantId: table.restaurantId, isAvailable: true });
                return NextResponse.json(new apiResponse(200, {
                    restaurantId: table.restaurantId,
                    tableId: table._id,
                    tableNumber: table.tableNumber,
                    sessionToken: table.sessionToken,
                    menu
                }, "Rejoined active session successfully"), { status: 200 });
            }
            return NextResponse.json(new apiError(409, "This table session is currently locked or invalid"), { status: 409 });
        }

        // Successfully initialized/rotated the table session
        const menu = await MenuItem.find({ restaurantId: claimedTable.restaurantId, isAvailable: true });
        return NextResponse.json(new apiResponse(200, {
            restaurantId: claimedTable.restaurantId,
            tableId: claimedTable._id,
            tableNumber: claimedTable.tableNumber,
            sessionToken: claimedTable.sessionToken,
            menu
        }, "Table claimed successfully"), { status: 200 });

    } catch (error) {
        console.error("Error claiming table:", error);
        return NextResponse.json(new apiError(500, "Failed to claim table"));
    }
}