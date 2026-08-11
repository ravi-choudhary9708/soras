"use client";
import React, { useState, useEffect, useRef } from "react";
import { Send, CheckCircle, Clock, XCircle, Loader2, Upload } from "lucide-react";
import { fetchWithAuth } from "@/utils/fetchWithAuth";

export default function SorasPayment() {
  const [status, setStatus] = useState(null); // current payment status
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [note, setNote] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const fileRef = useRef(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetchWithAuth("/api/payment/getPaymentStatus");
        const data = await res.json();
        if (data.success) setStatus(data.data);
      } catch (err) {
        console.error("Failed to load payment status:", err);
      } finally {
        setLoadingStatus(false);
      }
    };
    fetchStatus();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return setFeedback({ type: "error", message: "Please attach a payment screenshot." });
    setSubmitting(true);
    setFeedback({ type: "", message: "" });

    try {
      // Step 1: Get Cloudinary signature
      const sigRes = await fetchWithAuth("/api/media/getUploadSignature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "payment" })
      });
      const { signature, timestamp, folderName, apiKey, cloudName } = await sigRes.json();

      // Step 2: Upload to Cloudinary
      const form = new FormData();
      form.append("file", selectedFile);
      form.append("api_key", apiKey);
      form.append("timestamp", timestamp);
      form.append("signature", signature);
      form.append("folder", folderName);
      const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: form });
      const cloudData = await cloudRes.json();

      // Step 3: Submit payment record
      const payRes = await fetchWithAuth("/api/payment/submitPayment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ screenshotUrl: cloudData.secure_url, cloudinaryPublicId: cloudData.public_id, note })
      });
      const payData = await payRes.json();

      if (payRes.ok) {
        setFeedback({ type: "success", message: "Payment submitted! Our team will verify within 24 hours." });
        setSelectedFile(null);
        setPreview(null);
        setNote("");
      } else {
        setFeedback({ type: "error", message: payData.message || "Submission failed." });
      }
    } catch (err) {
      setFeedback({ type: "error", message: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const statusConfig = {
    approved: { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", label: "Payment Approved" },
    pending: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50 border-amber-200", label: "Verification Pending" },
    rejected: { icon: XCircle, color: "text-rose-600", bg: "bg-rose-50 border-rose-200", label: "Payment Rejected" },
  };

  return (
    <div className="max-w-md">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-900">Soras Subscription</h2>
        <p className="text-xs text-slate-400 mt-0.5">Submit your monthly subscription payment screenshot for verification</p>
      </div>

      {/* Current Status */}
      {loadingStatus ? (
        <div className="flex items-center text-slate-400 text-sm mb-4"><Loader2 size={14} className="animate-spin mr-2" /> Loading status...</div>
      ) : status?.pendingReviewList?.length > 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5">
          <p className="text-xs font-bold text-amber-700">⏳ You have a payment pending verification.</p>
          <p className="text-[11px] text-amber-600 mt-1">Our team will verify your screenshot within 24 hours.</p>
        </div>
      ) : null}

      {/* UPI Info */}
      <div className="bg-purple-50/60 border border-purple-100 rounded-2xl p-4 text-center mb-5">
        <p className="text-[10px] uppercase font-bold tracking-wider text-purple-600 mb-1">Pay To (UPI)</p>
        <p className="text-xl font-black text-purple-900 tracking-tight">purnima@ybl</p>
        <p className="text-[11px] text-slate-400 mt-1">Monthly subscription: ₹999/month</p>
      </div>

      {/* Upload Form */}
      <form onSubmit={handleSubmit} className="bg-white border rounded-2xl p-5 shadow-xs space-y-4">
        {/* Screenshot Upload */}
        <div>
          <label className="text-[11px] font-bold text-slate-400 uppercase block mb-2">Payment Screenshot</label>
          <input type="file" accept="image/*" ref={fileRef} onChange={handleFileChange} className="hidden" />
          <div
            onClick={() => fileRef.current.click()}
            className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition ${preview ? "border-purple-300 bg-purple-50/20" : "border-slate-200 hover:border-purple-400 bg-slate-50/50"}`}
          >
            {preview ? (
              <img src={preview} alt="Screenshot preview" className="max-h-40 mx-auto rounded-xl object-contain" />
            ) : (
              <div className="flex flex-col items-center text-slate-400">
                <Upload size={24} className="mb-1" />
                <p className="text-xs font-bold">Click to upload screenshot</p>
                <p className="text-[10px] mt-0.5">PNG, JPG up to 5MB</p>
              </div>
            )}
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Note (Optional)</label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={2}
            placeholder="Add any reference or note..."
            className="w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-xs outline-none focus:border-purple-500 resize-none"
          />
        </div>

        {feedback.message && (
          <div className={`p-3 rounded-xl text-xs font-semibold ${feedback.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
            {feedback.message}
          </div>
        )}

        <button type="submit" disabled={submitting}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-md shadow-purple-600/10">
          {submitting ? <><Loader2 size={13} className="animate-spin" /> Submitting...</> : <><Send size={13} /> Submit Payment</>}
        </button>
      </form>
    </div>
  );
}