"use client";
import React, { useState, useEffect } from "react";
import { UserPlus, Trash2, Loader2, Shield, ChefHat, User } from "lucide-react";
import { fetchWithAuth } from "@/utils/fetchWithAuth";

const ROLE_STYLES = {
  manager: "bg-purple-100 text-purple-700",
  staff: "bg-blue-100 text-blue-700",
  chef: "bg-orange-100 text-orange-700",
};
const ROLE_ICONS = {
  manager: Shield,
  staff: User,
  chef: ChefHat,
};

export default function Staff() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ fullName: "", username: "", email: "", phone: "", password: "", role: "" });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [deletingId, setDeletingId] = useState(null);

  const fetchStaff = async () => {
    try {
      const res = await fetchWithAuth("/api/staff");
      const data = await res.json();
      if (data.success) setStaffList(data.data);
    } catch (err) {
      console.error("Error fetching staff:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStaff(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback({ type: "", message: "" });
    try {
      const res = await fetchWithAuth("/api/registerStaff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: "success", message: "Staff member added successfully!" });
        setForm({ fullName: "", username: "", email: "", phone: "", password: "", role: "" });
        fetchStaff();
      } else {
        setFeedback({ type: "error", message: data.message || "Registration failed" });
      }
    } catch (err) {
      setFeedback({ type: "error", message: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove this staff member?")) return;
    setDeletingId(id);
    try {
      const res = await fetchWithAuth(`/api/staff/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setStaffList(prev => prev.filter(s => s._id !== id));
      } else {
        alert(data.message || "Delete failed");
      }
    } catch (err) {
      alert("Network error");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-900">Staff Management</h2>
        <p className="text-xs text-slate-400 mt-0.5">Register new staff members and manage your team</p>
      </div>

      {/* Registration Form */}
      <div className="bg-white border rounded-2xl p-5 shadow-xs mb-6">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <UserPlus size={16} /> Add New Staff Member
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Full Name</label>
              <input required type="text" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })}
                placeholder="e.g. Rahul Kumar" className="w-full bg-slate-50 border rounded-xl px-3 py-2.5 text-xs outline-none focus:border-purple-500" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Username</label>
              <input required type="text" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                placeholder="e.g. rahul_k" className="w-full bg-slate-50 border rounded-xl px-3 py-2.5 text-xs outline-none focus:border-purple-500" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Email</label>
              <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="rahul@example.com" className="w-full bg-slate-50 border rounded-xl px-3 py-2.5 text-xs outline-none focus:border-purple-500" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Phone</label>
              <input required type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="9876543210" className="w-full bg-slate-50 border rounded-xl px-3 py-2.5 text-xs outline-none focus:border-purple-500" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Password</label>
              <input required type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Secure password" className="w-full bg-slate-50 border rounded-xl px-3 py-2.5 text-xs outline-none focus:border-purple-500" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Role</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                className="w-full bg-slate-50 border rounded-xl px-3 py-2.5 text-xs outline-none focus:border-purple-500">
                <option value="staff">Staff (Waiter)</option>
                <option value="chef">Chef (Kitchen)</option>
              </select>
            </div>
          </div>

          {feedback.message && (
            <div className={`text-xs font-semibold p-3 rounded-xl ${feedback.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
              {feedback.message}
            </div>
          )}

          <button type="submit" disabled={submitting}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white text-xs font-bold rounded-xl py-3 transition flex items-center justify-center gap-2">
            {submitting ? <><Loader2 size={13} className="animate-spin" /> Adding...</> : <><UserPlus size={13} /> Add Staff Member</>}
          </button>
        </form>
      </div>

      {/* Staff List */}
      <div className="bg-white border rounded-2xl overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b bg-slate-50/50">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Team Members ({staffList.length})</h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-24 text-slate-400">
            <Loader2 className="animate-spin mr-2" size={16} /> Loading staff...
          </div>
        ) : staffList.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">No staff members yet.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y text-xs font-medium text-slate-700">
              {staffList.map((s) => {
                const RoleIcon = ROLE_ICONS[s.role] || User;
                return (
                  <tr key={s._id} className="hover:bg-slate-50/40">
                    <td className="p-4 font-bold text-slate-900 capitalize">{s.fullName || s.username}</td>
                    <td className="p-4 text-slate-400 font-mono">{s.email}</td>
                    <td className="p-4">
                      <span className={`flex items-center gap-1 w-fit px-2 py-0.5 rounded-md font-bold uppercase text-[10px] tracking-wide ${ROLE_STYLES[s.role] || "bg-slate-100 text-slate-600"}`}>
                        <RoleIcon size={10} /> {s.role}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleDelete(s._id)} disabled={deletingId === s._id}
                        className="text-rose-400 hover:text-rose-600 transition disabled:opacity-50">
                        {deletingId === s._id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}