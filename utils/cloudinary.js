import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (fileTarget, folderName) => {
    try {
        // 🚀 IF IT'S A REAL FILE OBJECT (From req.formData())
        if (fileTarget instanceof File || (typeof fileTarget === "object" && fileTarget.arrayBuffer)) {
            
            // 1. Convert the Web File object into a Node.js binary Buffer
            const arrayBuffer = await fileTarget.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // 2. Use upload_stream to push the binary chunk to Cloudinary
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: folderName,
                        resource_type: "image",
                    },
                    (error, result) => {
                        if (error) {
                            console.error("Cloudinary Stream Error:", error);
                            reject(error);
                        } else {
                            resolve(result); // Returns secure_url and public_id
                        }
                    }
                );
                stream.end(buffer); // Write buffer data bytes to stream channel
            });
        }

        // 🚀 FALLBACK: If it's already a base64 text string string
        const response = await cloudinary.uploader.upload(fileTarget, {
            folder: folderName,
            resource_type: "image",
        });
        return response;

    } catch (error) {
        console.error("Cloudinary upload core failure:", error);
        throw new Error(error.message || "Failed to upload image assets to storage cloud");
    }
};