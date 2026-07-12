import React, { useState, useRef, useEffect } from 'react';
import { User, Mail, Phone, Shield, LogOut, X, Check, Loader2, Edit3 } from 'lucide-react';

export default function UserProfileDropdown({ currentUser, onLogoutSuccess }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form states tracking user data
  const [fullName, setFullName] = useState(currentUser?.fullName || "Guest, please login");
  const [username, setUsername] = useState(currentUser?.username || "soras_founder");
  const [email, setEmail] = useState(currentUser?.email || "founder@soras.com");
  const [phone, setPhone] = useState(currentUser?.phone || "9876543210");
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const response = await fetch("/api/user/update-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, username, email, phone })
      });

      if (response.ok) {
        setSaveSuccess(true);
        setTimeout(() => {
          setSaveSuccess(false);
          setIsModalOpen(false);
        }, 1500);
      } else {
        alert("Failed to update profile information.");
      }
    } catch (error) {
      console.error("Profile update sync failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (response.ok && onLogoutSuccess) {
        onLogoutSuccess();
      }
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const initialAvatar = fullName.charAt(0).toUpperCase();

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Target Nav Header Account Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 px-3 py-2 rounded-xl bg-white border border-slate-100 hover:border-slate-200 shadow-sm transition-all duration-200 focus:outline-none select-none active:scale-[0.98]"
      >
        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm border border-indigo-100/50 shadow-inner">
          {initialAvatar}
        </div>
        <div className="flex flex-col text-left hidden sm:flex">
          <span className="text-xs font-semibold text-slate-800 leading-tight">Hi, {fullName.split(" ")[0]}</span>
          <span className="text-[10px] text-slate-400 font-medium capitalize">{currentUser?.role || "Manager"}</span>
        </div>
      </button>
      
      {/* Dropdown Card Action Drawer */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-64 origin-top-right rounded-2xl bg-white p-2 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05),0_8px_10px_-6px_rgba(0,0,0,0.05)] border border-slate-100 ring-1 ring-black ring-opacity-5 z-50 divide-y divide-slate-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-2.5">
            <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Signed In As</p>
            <p className="text-sm font-semibold text-slate-700 truncate mt-0.5">@{username}</p>
            <p className="text-xs text-slate-400 truncate">{email}</p>
          </div>
          
          <div className="py-1">
            <button
              onClick={() => { setIsOpen(false); setIsModalOpen(true); }}
              className="flex w-full items-center px-3 py-2 text-xs font-medium text-slate-600 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <Edit3 className="mr-2.5 h-4 w-4 text-slate-400" />
              Edit Account Profile
            </button>
          </div>

          <div className="py-1">
            <button
              onClick={handleLogout}
              className="flex w-full items-center px-3 py-2 text-xs font-medium text-rose-600 rounded-lg hover:bg-rose-50/60 transition-colors"
            >
              <LogOut className="mr-2.5 h-4 w-4 text-rose-400" />
              Sign Out Securely
            </button>
          </div>
        </div>
      )}

      {/* Profile Modification Glassmorphic Overlay Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden border border-slate-100 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800">Account Preferences</h3>
                <p className="text-xs text-slate-400 mt-0.5">Keep your manager contact profile valid and active.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all outline-none font-medium text-slate-700"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Username Identifier</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">@</span>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 text-sm bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all outline-none font-medium text-slate-700"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all outline-none font-medium text-slate-700"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Phone Context</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all outline-none font-medium text-slate-700"
                    required
                  />
                </div>
              </div>

              {/* Action Footer Drawer */}
              <div className="pt-4 border-t border-slate-50 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-xs font-semibold text-white rounded-xl shadow-sm transition-all flex items-center justify-center min-w-[100px] ${
                    saveSuccess 
                      ? 'bg-emerald-500 shadow-emerald-100' 
                      : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100 active:scale-95'
                  }`}
                  disabled={isSaving || saveSuccess}
                >
                  {isSaving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : saveSuccess ? (
                    <span className="flex items-center"><Check className="h-3.5 w-3.5 mr-1 stroke-[3]" /> Saved</span>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}