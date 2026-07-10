"use client";
import React, { useState } from "react";
import { LayoutDashboard, IndianRupee, Users, CreditCard, QrCode } from "lucide-react";
import TablesFloor from "./components/TablesFloor/page";
import Sales from "./components/Sales/page";
import Staff from "./components/Staff/page";
import SorasPayment from "./components/SorasPayment/page";
import QrGenerator from "./components/QrGenerator/page";

export default function ManagerDashboard() {
  const [activeTab, setActiveTab] = useState("tables"); // Default view

  return (
    <div className="flex min-h-screen bg-[#FAF9F6] text-slate-800 font-sans">
      {/* 🧭 Left Sidebar Navigation */}
      <aside className="w-64 bg-[#1E1B4B] text-slate-200 flex flex-col fixed h-full z-20 shadow-xl">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-black tracking-wider text-white">SORAS</h1>
          <p className="text-xs text-slate-400 mt-0.5">Manager Control Panel</p>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 mt-4">
          <button
            onClick={() => setActiveTab("tables")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition ${activeTab === "tables" ? "bg-purple-600 text-white shadow-md shadow-purple-900/20" : "hover:bg-slate-800/60 text-slate-400 hover:text-slate-200"
              }`}
          >
            <LayoutDashboard size={18} /> Live Floor Layout
          </button>

          <button
            onClick={() => setActiveTab("qr-generation")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition ${activeTab === "qr-generation" ? "bg-purple-600 text-white shadow-md" : "text-slate-400 hover:bg-slate-800/60"}`}
          >
            <QrCode size={18} /> QR Generation
          </button>

          <button
            onClick={() => setActiveTab("sales")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition ${activeTab === "sales" ? "bg-purple-600 text-white shadow-md shadow-purple-900/20" : "hover:bg-slate-800/60 text-slate-400 hover:text-slate-200"
              }`}
          >
            <IndianRupee size={18} /> Sales & Analytics
          </button>

          <button
            onClick={() => setActiveTab("staff")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition ${activeTab === "staff" ? "bg-purple-600 text-white shadow-md shadow-purple-900/20" : "hover:bg-slate-800/60 text-slate-400 hover:text-slate-200"
              }`}
          >
            <Users size={18} /> Staff Registration
          </button>

          <button
            onClick={() => setActiveTab("billing")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition ${activeTab === "billing" ? "bg-purple-600 text-white shadow-md shadow-purple-900/20" : "hover:bg-slate-800/60 text-slate-400 hover:text-slate-200"
              }`}
          >
            <CreditCard size={18} /> Soras Subscription
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800 text-center">
          <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-800/30">
            🟢 Storefront Active
          </span>
        </div>
      </aside>

      {/* 🖥️ Right Content Display Area */}
      <main className="flex-1 ml-64 p-8 min-h-screen">
        {activeTab === "tables" && <TablesFloor />}
        {activeTab === "sales" && <Sales />}
        {activeTab === "staff" && <Staff />}
        {activeTab === "billing" && <SorasPayment />}
        {activeTab === "qr-generation" && <QrGenerator />}
      </main>
    </div>
  );
}