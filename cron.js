import { Restaurant } from "@/models/restaurant.model";
import { Payment } from "@/models/payment.model";
import dbConnect from "@/libs/dbConnect";

// ⏰ This handler is triggered automatically by your hosting provider every morning at 6:00 AM
export async function runSubscriptionBillingSweep() {
    try {
        await dbConnect();
        const currentTime = new Date(); // Will represent exactly 6:00 AM on the execution day

        console.log(`🧹 Commencing morning account auditing sweep at: ${currentTime.toISOString()}`);

        /* 🛑 SWEEP A: Block expired free trial accounts
          Find restaurants where the current time has completely passed their graceExpiresAt window,
          who are still marked active, and flip them to false!
        */
        const blockedTrials = await Restaurant.updateMany(
            {
                graceExpiresAt: { $lt: currentTime },
                trialExpiresAt: { $exists: true }, // Verify they are a trial track user
                isAccountActive: true
            },
            {
                isAccountActive: false // 🔴 Lock the front gate
            }
        );
        console.log(`🔒 Trial Check complete. Accounts suspended: ${blockedTrials.modifiedCount}`);


        /* 🛑 SWEEP B: Block expired monthly subscription accounts
          For regular monthly users, look at the current active billing cycle.
        */
        const currentMonthStart = new Date(currentTime.getFullYear(), currentTime.getMonth(), 1);

        // Fetch array of all restaurant IDs that possess an approved payment record for this month
        const paidRestaurantIds = await Payment.find({
            billingCycle: currentMonthStart,
            status: "approved"
        }).distinct("restaurantId");

        /*
          Find restaurants that:
          1. Are NOT in the paid list
          2. Are NOT still in their trial/grace window (graceExpiresAt hasn't passed or doesn't exist)
          3. Are currently active
        */
        const blockedSubscribers = await Restaurant.updateMany(
            {
                _id: { $nin: paidRestaurantIds },
                $or: [
                    { graceExpiresAt: { $exists: false } }, // Standard subscriber
                    { graceExpiresAt: { $lt: currentTime } }  // Grace period over
                ],
                isAccountActive: true
            },
            {
                isAccountActive: false // 🔴 Lock the front gate
            }
        );
        console.log(`🔒 Subscriber Check complete. Accounts suspended: ${blockedSubscribers.modifiedCount}`);

    } catch (error) {
        console.error("🔥 CRITICAL SUBSCRIPTION SWEEPER FAILURE:", error);
    }
}