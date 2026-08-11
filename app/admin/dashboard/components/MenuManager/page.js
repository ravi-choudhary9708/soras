"use client";
import React, { useState, useEffect, useRef } from "react";
import { PlusCircle, Pencil, Trash2, Check, X, Loader2, ToggleLeft, ToggleRight, Image, Utensils } from "lucide-react";
import { fetchWithAuth } from "@/utils/fetchWithAuth";

const CATEGORIES = ["starters & appetizers", "main course", "breads & rice", "desserts", "beverages & shakes"];

export default function MenuManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list"); // "list" | "add"
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  // Add form state
  const fileInputRef = useRef(null);
  const [addForm, setAddForm] = useState({ name: "", price: "", category: "main course", description: "", isVeg: true });
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [adding, setAdding] = useState(false);

  const fetchMenu = async () => {
    try {
      const res = await fetchWithAuth("/api/res/menu");
      const data = await res.json();
      if (data.success) setItems(data.data);
    } catch (err) {
      console.error("Error fetching menu:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMenu(); }, []);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: "", message: "" }), 3000);
  };

  const startEdit = (item) => {
    setEditingId(item._id);
    setEditForm({ name: item.name, price: item.price, category: item.category, description: item.description || "", isVeg: item.isVeg, isAvailable: item.isAvailable });
  };

  const saveEdit = async (id) => {
    try {
      const res = await fetchWithAuth(`/api/res/menu/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (data.success) {
        setItems(prev => prev.map(it => it._id === id ? data.data : it));
        setEditingId(null);
        showFeedback("success", "Item updated successfully!");
      } else {
        showFeedback("error", data.message || "Update failed");
      }
    } catch (err) {
      showFeedback("error", "Network error");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this menu item?")) return;
    setDeletingId(id);
    try {
      const res = await fetchWithAuth(`/api/res/menu/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setItems(prev => prev.filter(it => it._id !== id));
        showFeedback("success", "Item deleted.");
      } else {
        showFeedback("error", data.message || "Delete failed");
      }
    } catch {
      showFeedback("error", "Network error");
    } finally {
      setDeletingId(null);
    }
  };

  const toggleAvailability = async (item) => {
    setTogglingId(item._id);
    try {
      const res = await fetchWithAuth("/api/res/menu/isAvail", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuItemId: item._id, isAvailable: !item.isAvailable })
      });
      const data = await res.json();
      if (data.success) {
        setItems(prev => prev.map(it => it._id === item._id ? { ...it, isAvailable: !it.isAvailable } : it));
      }
    } catch { }
    finally { setTogglingId(null); }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!addForm.name || !addForm.price) return showFeedback("error", "Name and price are required.");
    setAdding(true);
    try {
      let imageUrl = "";
      if (selectedFile) {
        const sigRes = await fetchWithAuth("/api/media/getUploadSignature", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "menu" })
        });
        const { signature, timestamp, folderName, apiKey, cloudName } = await sigRes.json();
        const fd = new FormData();
        fd.append("file", selectedFile);
        fd.append("api_key", apiKey); fd.append("timestamp", timestamp);
        fd.append("signature", signature); fd.append("folder", folderName);
        const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: fd });
        const cloudData = await cloudRes.json();
        imageUrl = cloudData.secure_url;
      }
      const res = await fetchWithAuth("/api/res/menu/add", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...addForm, price: Number(addForm.price), image: imageUrl })
      });
      const data = await res.json();
      if (data.success) {
        showFeedback("success", "Menu item added!");
        setAddForm({ name: "", price: "", category: "main course", description: "", isVeg: true });
        setSelectedFile(null); setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        fetchMenu();
        setView("list");
      } else {
        showFeedback("error", data.message || "Add failed");
      }
    } catch { showFeedback("error", "Network error"); }
    finally { setAdding(false); }
  };

  return (
    <div className="max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Menu Management</h2>
          <p className="text-xs text-slate-400 mt-0.5">Add, edit, delete, and toggle availability of menu items</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setView("list")} className={`text-xs font-bold px-4 py-2 rounded-xl border transition ${view === "list" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"}`}>
            All Items ({items.length})
          </button>
          <button onClick={() => setView("add")} className={`text-xs font-bold px-4 py-2 rounded-xl border transition flex items-center gap-1.5 ${view === "add" ? "bg-purple-600 text-white border-purple-600" : "bg-white text-slate-500 border-slate-200 hover:border-purple-300"}`}>
            <PlusCircle size={13} /> Add New
          </button>
        </div>
      </div>

      {feedback.message && (
        <div className={`mb-4 p-3 rounded-xl text-xs font-semibold ${feedback.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}>
          {feedback.message}
        </div>
      )}

      {/* ADD VIEW */}
      {view === "add" && (
        <div className="bg-white border rounded-2xl p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Add New Menu Item</h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Item Name</label>
                <input required type="text" value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder="e.g. Paneer Butter Masala" className="w-full bg-slate-50 border rounded-xl px-3 py-2.5 text-sm font-bold outline-none focus:border-purple-500" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Category</label>
                <select value={addForm.category} onChange={e => setAddForm({ ...addForm, category: e.target.value })}
                  className="w-full bg-slate-50 border rounded-xl px-3 py-2.5 text-sm font-bold outline-none focus:border-purple-500">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Price (₹)</label>
                <input required type="number" value={addForm.price} onChange={e => setAddForm({ ...addForm, price: e.target.value })}
                  placeholder="249" className="w-full bg-slate-50 border rounded-xl px-3 py-2.5 text-sm font-bold outline-none focus:border-purple-500" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Dietary Type</label>
                <div className="flex gap-2 h-[42px] items-center">
                  {[true, false].map(v => (
                    <button key={String(v)} type="button" onClick={() => setAddForm({ ...addForm, isVeg: v })}
                      className={`flex-1 h-full rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${addForm.isVeg === v ? (v ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-rose-50 border-rose-300 text-rose-800") : "bg-slate-50 border-slate-200 text-slate-400"}`}>
                      <span className={`w-2.5 h-2.5 rounded-full border ${v ? "bg-emerald-500 border-emerald-600" : "bg-rose-500 border-rose-600"}`} />
                      {v ? "Veg" : "Non-Veg"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Description</label>
              <textarea value={addForm.description} onChange={e => setAddForm({ ...addForm, description: e.target.value })}
                rows={2} placeholder="Optional description..." className="w-full bg-slate-50 border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-purple-500 resize-none" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Image (Optional)</label>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
              <div onClick={() => fileInputRef.current.click()} className="border-2 border-dashed border-slate-200 hover:border-purple-400 rounded-2xl p-4 text-center cursor-pointer transition flex items-center justify-center gap-2">
                {imagePreview ? <img src={imagePreview} className="h-20 object-contain rounded-xl" /> : <><Image size={18} className="text-slate-300" /><span className="text-xs text-slate-400 font-bold">Click to upload image</span></>}
              </div>
            </div>
            <button type="submit" disabled={adding} className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition">
              {adding ? <><Loader2 size={15} className="animate-spin" /> Adding...</> : <><PlusCircle size={15} /> Add Item</>}
            </button>
          </form>
        </div>
      )}

      {/* LIST VIEW */}
      {view === "list" && (
        <div className="bg-white border rounded-2xl overflow-hidden shadow-xs">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-slate-400"><Loader2 className="animate-spin mr-2" size={18} /> Loading menu...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Utensils size={40} className="mx-auto mb-2 opacity-30" />
              <p className="font-bold">No menu items yet.</p>
              <button onClick={() => setView("add")} className="mt-2 text-xs text-purple-600 font-bold hover:underline">Add your first item →</button>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Item</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Available</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y text-xs text-slate-700">
                {items.map(item => (
                  <tr key={item._id} className="hover:bg-slate-50/40">
                    {editingId === item._id ? (
                      <>
                        <td className="p-3"><input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="w-full bg-slate-100 border rounded-lg px-2 py-1.5 text-xs font-bold outline-none focus:border-purple-400" /></td>
                        <td className="p-3">
                          <select value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })} className="bg-slate-100 border rounded-lg px-2 py-1.5 text-xs outline-none focus:border-purple-400">
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </td>
                        <td className="p-3"><input type="number" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: Number(e.target.value) })} className="w-20 bg-slate-100 border rounded-lg px-2 py-1.5 text-xs font-bold outline-none focus:border-purple-400" /></td>
                        <td className="p-3"><span className="text-slate-400 text-[10px]">—</span></td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => saveEdit(item._id)} className="text-emerald-600 hover:text-emerald-700"><Check size={15} /></button>
                            <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-slate-600"><X size={15} /></button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {item.image ? <img src={item.image} className="w-9 h-9 rounded-lg object-cover border" /> : <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center"><Utensils size={14} className="text-slate-300" /></div>}
                            <div>
                              <p className="font-bold text-slate-900 capitalize">{item.name}</p>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${item.isVeg ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{item.isVeg ? "VEG" : "NON-VEG"}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 capitalize text-slate-500">{item.category}</td>
                        <td className="p-4 font-bold text-slate-900">₹{item.price}</td>
                        <td className="p-4">
                          <button onClick={() => toggleAvailability(item)} disabled={togglingId === item._id} className="transition">
                            {togglingId === item._id ? <Loader2 size={18} className="animate-spin text-slate-400" /> : item.isAvailable ? <ToggleRight size={22} className="text-emerald-500" /> : <ToggleLeft size={22} className="text-slate-300" />}
                          </button>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => startEdit(item)} className="text-slate-400 hover:text-purple-600 transition"><Pencil size={14} /></button>
                            <button onClick={() => handleDelete(item._id)} disabled={deletingId === item._id} className="text-slate-400 hover:text-rose-600 transition disabled:opacity-50">
                              {deletingId === item._id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
