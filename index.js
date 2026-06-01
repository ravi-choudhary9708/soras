import { useState } from "react";

export default function PaymentForm() {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleUploadPipeline = async (e) => {
        e.preventDefault();
        if (!file) return alert("Please select a screenshot file");

        setLoading(true);
        try {
            // 🔄 STEP 1: Ask your Next.js backend for a secure upload token signature
            const sigResponse = await fetch("/api/admin/get-upload-signature", { method: "POST" });
            const sigData = await sigResponse.json();

            if (!sigResponse.ok) throw new Error("Could not acquire secure upload authorization");

            // 🔄 STEP 2: Package data into FormData for Cloudinary's API
            const cloudinaryFormData = new FormData();
            cloudinaryFormData.append("file", file); // The actual raw binary file object
            cloudinaryFormData.append("api_key", sigData.apiKey);
            cloudinaryFormData.append("timestamp", sigData.timestamp);
            cloudinaryFormData.append("signature", sigData.signature);
            cloudinaryFormData.append("folder", sigData.folder);

            // 🚀 STEP 3: Push binary straight to Cloudinary bypasses Next.js completely!
            const cloudResponse = await fetch(
                `https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`,
                { method: "POST", body: cloudinaryFormData }
            );
            const cloudData = await cloudResponse.json();

            if (!cloudResponse.ok) throw new Error("Cloudinary file ingestion failed");
            
            console.log("Uploaded successfully! Asset URL:", cloudData.secure_url);

            // 🔄 STEP 4: Send only the final text image URLs to your database save endpoint
            const dbResponse = await fetch("/api/admin/submitPayment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    screenshotUrl: cloudData.secure_url,
                    cloudinaryPublicId: cloudData.public_id,
                    note: "Payment submitted directly from browser client tier"
                })
            });

            if (dbResponse.ok) alert("Payment successfully created!");

        } catch (error) {
            console.error("Pipeline failure:", error);
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleUploadPipeline}>
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
            <button type="submit" disabled={loading}>{loading ? "Uploading..." : "Submit Payment"}</button>
        </form>
    );
}