import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (fileBase64, folderName) => {
    try {
        const response = await cloudinary.uploader.upload(fileBase64, {
            folder: folderName,
            resource_type: "image",
        });
        return response; // Contains .secure_url and .public_id
    } catch (error) {
        console.error("Cloudinary upload core failure:", error);
        throw new Error("Failed to upload image assets to storage cloud");
    }
};