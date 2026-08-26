"use client";
import React, { useState, useRef } from "react";
import { PlusCircle, Image, Utensils, IndianRupee, Eye, Check } from "lucide-react";
import { fetchWithAuth } from "@/utils/fetchWithAuth";

export default function AddMenu() {
  const fileInputRef = useRef(null);
  
  // Form State matrices
  const [itemName, setItemName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Main Course");
  const [description, setDescription] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [isVeg, setIsVeg] = useState(true);
  const [loading,setLoading]=useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // Dynamic client-side image intake simulation
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!itemName || !price) return alert("❌ Item Name and Price are mandatory parameters!");
    if(!selectedFile) return alert("please select a file");
     setLoading(true);

    try {
      // Step A: Request the signature from your backend
      const sigRes = await fetchWithAuth("/api/media/getUploadSignature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "menu" })
      });
      const { signature, timestamp, folderName, apiKey, cloudName } = await sigRes.json();
     console.log("signature:",signature)
   // Step B: Direct upload to Cloudinary (saves your server bandwidth)
      const cloudinaryForm = new FormData();
      cloudinaryForm.append("file", selectedFile);
      cloudinaryForm.append("api_key", apiKey);
      cloudinaryForm.append("timestamp", timestamp);
      cloudinaryForm.append("signature", signature);
      cloudinaryForm.append("folder", folderName);

      const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: cloudinaryForm
      });
      const cloudData = await cloudRes.json();
      const secureImageUrl = cloudData.secure_url;

      // Step C: Send the payload to your backend menu controller
      const backendRes = await fetchWithAuth("/api/res/menu/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:itemName,
          description,
          price,
          category,
          isVeg,
          image: secureImageUrl
        })
      });

      if (backendRes.ok) {
        alert("Dish added to Soras successfully!");
    
    // Reset inputs
        setItemName("");
        setPrice("");
        setDescription("");
        setIsVeg(true);
        setSelectedFile(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = ""; // Resets DOM file input
      }else{
        alert("Backend failed to process menu item entry.");
      }
    } catch (error) {
      console.error("Onboarding item failed:", error);
    }finally{
      setLoading(false);
    }

  };

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-900">Add Menu Item</h2>
        <p className="text-xs text-slate-400 mt-0.5">Ingest new culinary offerings directly into your live customer routing applications</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 🛠️ LEFT: Control panel ingestion form */}
        <div className="bg-white border rounded-2xl p-6 shadow-xs lg:col-span-2 space-y-5">
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Item Title / Name</label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g., Paneer Butter Masala"
                  className="w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-sm font-bold outline-hidden focus:border-purple-600"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Base Catalog Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-sm font-bold outline-hidden focus:border-purple-600"
                >
                  <option>Starters & Appetizers</option>
                  <option>Main Course</option>
                  <option>Breads & Rice</option>
                  <option>Desserts</option>
                  <option>Beverages & Shakes</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Price Vector (₹)</label>
                <div className="relative">
                  <span className="absolute left-4 top-2.5 text-slate-400 text-sm font-bold">₹</span>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="249"
                    className="w-full bg-slate-50 border rounded-xl pl-8 pr-4 py-2.5 text-sm font-bold outline-hidden focus:border-purple-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Dietary Attribute Tag</label>
                <div className="flex gap-2 h-[42px] items-center">
                  <button
                    type="button"
                    onClick={() => setIsVeg(true)}
                    className={`flex-1 h-full rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${isVeg ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-slate-50 border-slate-200 text-slate-400"}`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-600"></span> Veg
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsVeg(false)}
                    className={`flex-1 h-full rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${!isVeg ? "bg-rose-50 border-rose-300 text-rose-800" : "bg-slate-50 border-slate-200 text-slate-400"}`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-rose-600"></span> Non-Veg
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Menu Description / Notes</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary detailing ingredients, portions, or flavor matrix specs..."
                rows={3}
                className="w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-sm font-medium outline-hidden focus:border-purple-600 resize-none"
              />
            </div>

            {/* 📸 Image File Dropzone Wrapper */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Menu Asset Presentation (Image)</label>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageChange}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current.click()}
                className="border-2 border-dashed border-slate-200 hover:border-purple-400 rounded-2xl p-5 text-center cursor-pointer transition bg-slate-50/50 hover:bg-purple-50/10 flex flex-col items-center justify-center"
              >
                <Image className="text-slate-300 mb-1.5 stroke-1" size={28} />
                <p className="text-xs font-bold text-slate-700">Click to select product photograph</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Supports PNG, JPEG up to 5MB dimensions</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 transition shadow-md shadow-purple-600/10"
            >
              <PlusCircle size={16} /> {loading ? "Adding..." : "Add Menu Item"}
            </button>
          </form>
        </div>

        {/* 👁️ RIGHT: Live UI Rendering Mock for Customer App Validation */}
        <div className="flex flex-col items-center justify-start lg:pt-0 pt-4">
          <div className="w-full max-w-[280px] text-left self-center sticky top-8">
            <span className="text-[11px] font-black text-purple-600 uppercase tracking-widest block mb-2 flex items-center gap-1.5"><Eye size={12}/> Live Preview Node</span>
            
            <div className="bg-white border rounded-3xl overflow-hidden shadow-md transition-all duration-300 hover:shadow-lg">
              {/* Asset Box */}
              <div className="h-44 bg-slate-100 relative flex items-center justify-center overflow-hidden border-b">
                {imagePreview ? (
                  <img src={imagePreview} alt="Live Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-slate-300 flex flex-col items-center">
                    <Utensils size={36} className="stroke-1" />
                    <span className="text-[10px] uppercase font-bold tracking-wider mt-1.5">No Asset Attached</span>
                  </div>
                )}
                {/* Veg/Non-veg Flag Badge */}
                <span className={`absolute top-3 right-3 w-5 h-5 bg-white shadow-xs rounded-md border flex items-center justify-center ${isVeg ? "border-emerald-500" : "border-rose-500"}`}>
                  <span className={`w-2 h-2 rounded-full ${isVeg ? "bg-emerald-500" : "bg-rose-500"}`}></span>
                </span>
              </div>

              {/* Text Meta Fields */}
              <div className="p-4 space-y-2">
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide bg-slate-100 px-2 py-0.5 rounded">
                    {category}
                  </span>
                  <h4 className="text-base font-black text-slate-900 mt-1 truncate">
                    {itemName || "Product Display Name"}
                  </h4>
                </div>
                
                <p className="text-xs text-slate-400 line-clamp-2 min-h-[32px] font-medium leading-relaxed">
                  {description || "Provide an engaging description to attract diners scanning from tables."}
                </p>

                <div className="flex justify-between items-center border-t border-dashed pt-2.5 mt-1">
                  <span className="text-lg font-black text-slate-900">
                    ₹{price || "0.00"}
                  </span>
                  <span className="bg-purple-600 text-white font-bold px-3 py-1 rounded-xl text-[11px] tracking-wide">
                    Add +
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}