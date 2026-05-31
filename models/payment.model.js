import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
    {
        restaurantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Restaurant",
            required: true
        },
        managerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        screenshotUrl: {
            type: String,
            required: true // Cloudinary secure URL
        },
        cloudinaryPublicId: {
            type: String,
            required: true
        },
        billingCycle: {
            type: Date,
            required: true // The month/year this payment is covering (e.g., June 2026)
        },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending"
        },
        rejectionReason: {
            type: String,
            trim: true
        }
    },
    { timestamps: true }
);

export const Payment = mongoose.models.Payment || mongoose.model("Payment", paymentSchema);