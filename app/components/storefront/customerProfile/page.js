"use client";
import React, { useState, useRef, useEffect } from 'react';
import { User, Mail, Phone, LogOut, X, LogIn, UserCheck, ShoppingBag } from 'lucide-react';

// ─── CustomerProfileWidget ──────────────────────────────────────────────────
// Shows at the top-right of the storefront/customer-facing page.
// • If logged in  → shows avatar initial + name, click opens dropdown with info + logout
// • If guest      → shows "Guest, please login" with a login prompt icon
//
// Props:
//   currentCustomer  — object from /api/customer/me (null if guest)
//   onLoginClick     — function to call when guest clicks "Login" (open login modal etc.)
//   onLogoutSuccess  — called after successful logout (redirect or refresh)
// ───────────────────────────────────────────────────────────────────────────

export default function CustomerProfileWidget({ currentCustomer, onLoginClick, onLogoutSuccess }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const isGuest = !currentCustomer;

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

    const handleLogout = async () => {
        try {
            const response = await fetch("/api/customer/logout", { method: "POST" });
            if (response.ok) {
                if (onLogoutSuccess) {
                    onLogoutSuccess();
                } else {
                    window.location.reload();
                }
            }
        } catch (err) {
            console.error("Customer logout failed:", err);
        }
    };

    // Get display name — customer model uses `name` field (not `fullName`)
    const displayName = currentCustomer?.name || "Guest";
    const initial = displayName.charAt(0).toUpperCase();

    // ── GUEST STATE ──────────────────────────────────────────────────────────
    if (isGuest) {
        return (
            <button
                onClick={onLoginClick}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-100 hover:border-indigo-200 shadow-sm transition-all duration-200 active:scale-[0.98] group"
            >
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                    <User className="h-4 w-4" />
                </div>
                <div className="flex flex-col text-left hidden sm:flex">
                    <span className="text-xs font-semibold text-slate-500 leading-tight group-hover:text-slate-700">Guest</span>
                    <span className="text-[10px] text-indigo-500 font-medium">Please login →</span>
                </div>
            </button>
        );
    }

    // ── LOGGED-IN STATE ──────────────────────────────────────────────────────
    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>

            {/* Avatar Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-3 px-3 py-2 rounded-xl bg-white border border-slate-100 hover:border-slate-200 shadow-sm transition-all duration-200 focus:outline-none select-none active:scale-[0.98]"
            >
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-sm border border-emerald-100/50 shadow-inner">
                    {initial}
                </div>
                <div className="flex flex-col text-left hidden sm:flex">
                    <span className="text-xs font-semibold text-slate-800 leading-tight capitalize">Hi, {displayName.split(" ")[0]}</span>
                    <span className="text-[10px] text-emerald-500 font-medium flex items-center gap-1">
                        <UserCheck className="h-2.5 w-2.5" /> Logged In
                    </span>
                </div>
            </button>

            {/* Dropdown Card */}
            {isOpen && (
                <div className="absolute right-0 mt-2.5 w-64 origin-top-right rounded-2xl bg-white p-2 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05),0_8px_10px_-6px_rgba(0,0,0,0.05)] border border-slate-100 ring-1 ring-black ring-opacity-5 z-50 divide-y divide-slate-50 animate-in fade-in slide-in-from-top-2 duration-150">

                    {/* User Info Header */}
                    <div className="px-3 py-2.5">
                        <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Signed In As</p>
                        <p className="text-sm font-semibold text-slate-700 truncate mt-0.5 capitalize">{displayName}</p>
                        <p className="text-xs text-slate-400 truncate">{currentCustomer?.email}</p>
                    </div>

                    {/* Profile Details */}
                    <div className="py-2 px-3 space-y-1.5">
                        {currentCustomer?.phone && (
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <Phone className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                                <span>{currentCustomer.phone}</span>
                            </div>
                        )}
                        {currentCustomer?.orderHistory?.length > 0 && (
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <ShoppingBag className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                                <span>{currentCustomer.orderHistory.length} past orders</span>
                            </div>
                        )}
                    </div>

                    {/* Logout */}
                    <div className="py-1">
                        <button
                            onClick={handleLogout}
                            className="flex w-full items-center px-3 py-2 text-xs font-medium text-rose-600 rounded-lg hover:bg-rose-50/60 transition-colors"
                        >
                            <LogOut className="mr-2.5 h-4 w-4 text-rose-400" />
                            Sign Out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
