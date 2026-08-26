"use client";
import React, { useState, useEffect } from "react";
import { LayoutDashboard, IndianRupee, Users, CreditCard, QrCode, Utensils, ClipboardList, Menu, X } from "lucide-react";
import TablesFloor from "./components/TablesFloor/page";
import Sales from "./components/Sales/page";
import Staff from "./components/Staff/page";
import SorasPayment from "./components/SorasPayment/page";
import QrGenerator from "./components/QrGenerator/page";
import AddMenu from "./components/AddMenu/page";
import MenuManager from "./components/MenuManager/page";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import UserProfileDropdown from "@/app/components/dashboard/userProfile/page";

const NAV_ITEMS = [
  { key: "tables", label: "Live Floor Layout", icon: LayoutDashboard },
  { key: "qr-generation", label: "QR Generation", icon: QrCode },
  { key: "add-menu", label: "Add Menu Item", icon: Utensils },
  { key: "manage-menu", label: "Manage Menu", icon: ClipboardList },
  { key: "sales", label: "Sales & Analytics", icon: IndianRupee },
  { key: "staff", label: "Staff Management", icon: Users },
  { key: "billing", label: "Soras Subscription", icon: CreditCard },
];

const TAB_LABELS = {
  tables: "Live Floor Layout",
  "qr-generation": "QR Code Generation",
  "add-menu": "Add Menu Item",
  "manage-menu": "Manage Menu",
  sales: "Sales & Analytics",
  staff: "Staff Management",
  billing: "Soras Subscription",
};

export default function ManagerDashboard() {
  const [activeTab, setActiveTab] = useState("tables");
  const [currentUser, setCurrentUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function fetchCurrentUser() {
      try {
        const res = await fetchWithAuth("/api/user/me");
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.data);
        }
      } catch (err) {
        console.error("Could not fetch user profile:", err);
      }
    }
    fetchCurrentUser();
  }, []);

  const handleLogoutSuccess = () => {
    window.location.href = "/auth";
  };

  const handleNavClick = (key) => {
    setActiveTab(key);
    setSidebarOpen(false); // Auto-close on mobile
  };

  return (
    <div className="flex min-h-screen bg-[#FAF9F6] text-slate-800 font-sans">

      {/* 🔲 Mobile backdrop overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 🧭 Sidebar Navigation — fixed on desktop, slide-in drawer on mobile */}
      <aside className={`
        fixed h-full z-40 bg-[#1E1B4B] text-slate-200 flex flex-col shadow-xl
        w-64 transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
      `}>
        <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black tracking-wider text-white">SORAS</h1>
            <p className="text-xs text-slate-400 mt-0.5">Manager Control Panel</p>
          </div>
          {/* Close button — mobile only */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 mt-2 overflow-y-auto">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => handleNavClick(key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition ${
                activeTab === key
                  ? "bg-purple-600 text-white shadow-md shadow-purple-900/20"
                  : "hover:bg-slate-800/60 text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700/50">
          {currentUser && (
            <div className="flex items-center gap-2 mb-3 px-2">
              <div className="w-7 h-7 rounded-lg bg-purple-600/30 flex items-center justify-center text-purple-300 font-bold text-xs">
                {(currentUser.fullName || currentUser.username || "M").charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-200 capitalize truncate max-w-[140px]">{currentUser.fullName || currentUser.username}</p>
                <p className="text-[9px] text-slate-500 uppercase font-bold">{currentUser.role}</p>
              </div>
            </div>
          )}
          <UserProfileDropdown
            currentUser={currentUser}
            onLogoutSuccess={handleLogoutSuccess}
          />
          <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-800/30 block text-center mt-3">
            🟢 Storefront Active
          </span>
        </div>
      </aside>

      {/* 🖥️ Right Content Display Area */}
      <main className="flex-1 lg:ml-64 min-h-screen flex flex-col">
        {/* ─── Sticky Top Header ─── */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm px-4 sm:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Hamburger button — mobile only */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-700 hover:text-slate-900 transition"
            >
              <Menu size={22} />
            </button>
            <div>
              <h2 className="text-sm font-bold text-slate-700">{TAB_LABELS[activeTab]}</h2>
              <p className="text-[11px] text-slate-400 font-medium">Manager Dashboard</p>
            </div>
          </div>
        </header>

        {/* ─── Tab Content ─── */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          {activeTab === "tables" && <TablesFloor />}
          {activeTab === "qr-generation" && <QrGenerator />}
          {activeTab === "add-menu" && <AddMenu />}
          {activeTab === "manage-menu" && <MenuManager />}
          {activeTab === "sales" && <Sales />}
          {activeTab === "staff" && <Staff />}
          {activeTab === "billing" && <SorasPayment />}
        </div>
      </main>
    </div>
  );
}