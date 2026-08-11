"use client";
import React, { useState, useRef, useEffect } from 'react';
import { User, Mail, Phone, LogOut, X, Check, Loader2, Edit3, ShieldCheck, AtSign, Lock } from 'lucide-react';
import { fetchWithAuth } from "@/utils/fetchWithAuth";

export default function UserProfileDropdown({ currentUser, onLogoutSuccess }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ─── Form states — synced from currentUser whenever it loads ───
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  const dropdownRef = useRef(null);

  // ─── Sync form values when currentUser prop loads (async fetch in parent) ───
  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.fullName || "");
      setUsername(currentUser.username || "");
      setEmail(currentUser.email || "");
      setPhone(currentUser.phone || "");
    }
  }, [currentUser]);

  // ─── Close dropdown when clicking outside ───
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ─── Save profile changes ───
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError("");

    try {
      const response = await fetchWithAuth("/api/user/updateProfile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, username, email, phone })
      });

      const result = await response.json();

      if (response.ok) {
        setSaveSuccess(true);
        setTimeout(() => {
          setSaveSuccess(false);
          setIsModalOpen(false);
        }, 1500);
      } else {
        setSaveError(result.message || "Failed to update profile. Please try again.");
      }
    } catch (error) {
      console.error("Profile update failed:", error);
      setSaveError("Network error. Please check your connection.");
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Logout ───
  const handleLogout = async () => {
    try {
      const response = await fetchWithAuth("/api/auth/logout", { method: "POST" });
      if (response.ok) {
        if (onLogoutSuccess) {
          onLogoutSuccess();
        } else {
          window.location.href = "/auth";
        }
      }
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // ─── Derived display values ───
  const isLoaded = !!currentUser;
  const displayName = fullName || currentUser?.username || "Loading...";
  const initialAvatar = displayName.charAt(0).toUpperCase();

  return (
    <>
      {/* ─── Trigger Button ─────────────────────────────────────────── */}
      <div className="relative inline-block text-left" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2.5 px-3 py-2 rounded-xl bg-white border border-[#E1DEFE] hover:border-[#5D44FF]/40 shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none select-none active:scale-[0.98]"
        >
          {/* Avatar circle */}
          <div className="w-8 h-8 rounded-lg bg-[#5D44FF]/10 flex items-center justify-center text-[#5D44FF] font-bold text-sm border border-[#5D44FF]/20">
            {isLoaded ? initialAvatar : <User className="h-4 w-4 text-slate-400" />}
          </div>

          <div className="flex flex-col text-left hidden sm:flex">
            <span className="text-xs font-bold text-[#1A1A1A] leading-tight capitalize">
              {isLoaded ? displayName.split(" ")[0] : "Loading..."}
            </span>
            <span className="text-[10px] text-[#5D44FF] font-semibold capitalize">
              {currentUser?.role || "—"}
            </span>
          </div>
        </button>

        {/* ─── Dropdown Card ─────────────────────────────────────────── */}
        {isOpen && (
          <div className="absolute right-0 mt-2.5 w-64 origin-top-right rounded-2xl bg-white p-2 shadow-[0_8px_30px_rgba(93,68,255,0.12)] border border-[#F2F1FA] z-50 divide-y divide-[#F4F4F6]">

            {/* User Info */}
            <div className="px-3 py-2.5">
              <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Signed In As</p>
              <p className="text-sm font-bold text-[#1A1A1A] truncate mt-0.5 capitalize">{displayName}</p>
              <p className="text-xs text-slate-400 truncate">{email}</p>
              <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-[#5D44FF] bg-[#5D44FF]/8 px-2 py-0.5 rounded-full capitalize">
                <ShieldCheck className="h-2.5 w-2.5" />
                {currentUser?.role}
              </span>
            </div>

            {/* Edit button */}
            <div className="py-1">
              <button
                onClick={() => { setIsOpen(false); setIsModalOpen(true); }}
                className="flex w-full items-center px-3 py-2 text-xs font-semibold text-[#626264] rounded-xl hover:bg-[#F4F4F6] hover:text-[#1A1A1A] transition-colors"
              >
                <Edit3 className="mr-2.5 h-4 w-4 text-[#5D44FF]" />
                Edit Profile
              </button>
            </div>

            {/* Logout button */}
            <div className="py-1">
              <button
                onClick={handleLogout}
                className="flex w-full items-center px-3 py-2 text-xs font-semibold text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
              >
                <LogOut className="mr-2.5 h-4 w-4 text-rose-400" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Edit Profile Modal — centered, auth-style ────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">

          {/* Card — matches auth page exactly */}
          <div className="relative w-full max-w-md bg-white border border-[#F2F1FA] rounded-2xl shadow-lg shadow-[#5D44FF]/8 overflow-hidden">

            {/* Decorative blobs — same as auth page */}
            <div className="absolute top-[-40px] left-[-40px] w-36 h-36 bg-[#EEEDFD] rounded-3xl transform rotate-12 -z-0 pointer-events-none" />
            <div className="absolute top-[-60px] right-[-40px] w-48 h-48 bg-[#EEEDFD] rounded-full -z-0 opacity-60 pointer-events-none" />

            <div className="relative z-10 p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  {/* Avatar big */}
                  <div className="w-14 h-14 rounded-2xl bg-[#5D44FF]/10 border border-[#5D44FF]/20 flex items-center justify-center text-2xl font-black text-[#5D44FF] mb-3">
                    {initialAvatar}
                  </div>
                  <h2 className="text-xl font-black text-[#1A1A1A] tracking-tight">Edit Profile</h2>
                  <p className="text-xs text-[#8C8C8C] font-medium mt-0.5">
                    Role: <span className="text-[#5D44FF] font-bold capitalize">{currentUser?.role}</span> — role cannot be changed
                  </p>
                </div>

                <button
                  onClick={() => { setIsModalOpen(false); setSaveError(""); }}
                  className="p-2 rounded-xl text-[#8C8C8C] hover:text-[#1A1A1A] hover:bg-[#F4F4F6] transition-all mt-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* ─── Form ─── */}
              <form onSubmit={handleUpdateProfile} className="space-y-4">

                {/* Full Name */}
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-bold text-[#1A1A1A]">Full Name</label>
                  <div className="relative flex items-center">
                    <User className="absolute left-4 w-4 h-4 text-[#7A6EFE]" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Alex Mercer"
                      className="w-full pl-11 pr-4 py-3.5 bg-white border border-[#E1DEFE] rounded-xl text-sm font-medium text-[#1A1A1A] placeholder-[#8E8D99] focus:outline-none focus:border-[#5D44FF] focus:ring-1 focus:ring-[#5D44FF] transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Username */}
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-bold text-[#1A1A1A]">Username</label>
                  <div className="relative flex items-center">
                    <AtSign className="absolute left-4 w-4 h-4 text-[#7A6EFE]" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="soras_manager"
                      className="w-full pl-11 pr-4 py-3.5 bg-white border border-[#E1DEFE] rounded-xl text-sm font-medium text-[#1A1A1A] placeholder-[#8E8D99] focus:outline-none focus:border-[#5D44FF] focus:ring-1 focus:ring-[#5D44FF] transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-bold text-[#1A1A1A]">Email Address</label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-4 w-4 h-4 text-[#7A6EFE]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="manager@soras.com"
                      className="w-full pl-11 pr-4 py-3.5 bg-white border border-[#E1DEFE] rounded-xl text-sm font-medium text-[#1A1A1A] placeholder-[#8E8D99] focus:outline-none focus:border-[#5D44FF] focus:ring-1 focus:ring-[#5D44FF] transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-bold text-[#1A1A1A]">Phone Number</label>
                  <div className="relative flex items-center">
                    <Phone className="absolute left-4 w-4 h-4 text-[#7A6EFE]" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="9876543210"
                      className="w-full pl-11 pr-4 py-3.5 bg-white border border-[#E1DEFE] rounded-xl text-sm font-medium text-[#1A1A1A] placeholder-[#8E8D99] focus:outline-none focus:border-[#5D44FF] focus:ring-1 focus:ring-[#5D44FF] transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Role (read-only display) */}
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-bold text-[#1A1A1A]">Role</label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-4 w-4 h-4 text-slate-300" />
                    <div className="w-full pl-11 pr-4 py-3.5 bg-[#F4F4F6] border border-[#E1DEFE] rounded-xl text-sm font-medium text-[#8C8C8C] capitalize cursor-not-allowed select-none">
                      {currentUser?.role || "—"}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium pl-1">Role is managed by your system administrator.</p>
                </div>

                {/* Error banner */}
                {saveError && (
                  <div className="p-3.5 text-xs font-semibold rounded-xl text-center border bg-rose-50 border-rose-200 text-rose-700">
                    {saveError}
                  </div>
                )}

                {/* Submit button — same style as auth page */}
                <button
                  type="submit"
                  disabled={isSaving || saveSuccess}
                  className={`w-full mt-2 font-semibold py-3.5 rounded-xl flex items-center justify-center space-x-2 transition-all active:scale-[0.99] shadow-md disabled:cursor-not-allowed ${
                    saveSuccess
                      ? "bg-emerald-500 shadow-emerald-100 text-white"
                      : "bg-[#5D44FF] hover:bg-[#4C34EC] text-white shadow-[#5D44FF]/10 disabled:bg-[#A4A2B2]"
                  }`}
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span className="text-sm">Saving Changes...</span>
                    </>
                  ) : saveSuccess ? (
                    <>
                      <Check className="h-4 w-4 stroke-[3]" />
                      <span className="text-sm">Saved!</span>
                    </>
                  ) : (
                    <span className="text-sm">Save Changes</span>
                  )}
                </button>

                {/* Cancel link */}
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setSaveError(""); }}
                  disabled={isSaving}
                  className="w-full text-center text-xs font-semibold text-[#8C8C8C] hover:text-[#1A1A1A] transition-colors py-1 disabled:opacity-50"
                >
                  Cancel
                </button>

              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}