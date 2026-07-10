"use client";
import React from "react";
import { TrendingUp, ArrowUpRight } from "lucide-react";

export default function Sales() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-900">Sales Report Tracker</h2>
        <p className="text-xs text-slate-400 mt-0.5">Aggregated metrics reflecting current active database sessions</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 border rounded-2xl shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gross Shift Capture</p>
          <p className="text-3xl font-black text-slate-900 mt-1">₹14,250</p>
        </div>
        <div className="bg-white p-5 border rounded-2xl shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">UPI Channel Volume</p>
          <p className="text-3xl font-black text-purple-600 mt-1">₹9,400</p>
        </div>
        <div className="bg-white p-5 border rounded-2xl shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cash Register Liquid</p>
          <p className="text-3xl font-black text-emerald-600 mt-1">₹4,850</p>
        </div>
      </div>

      <div className="bg-white border rounded-2xl p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-purple-600"/> High-Velocity Menu Items</h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span>Margherita Pizza</span>
              <span className="text-slate-400">86 Orders</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-purple-600 h-full rounded-full" style={{ width: "85%" }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span>Fresh Lemonade</span>
              <span className="text-slate-400">54 Orders</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-purple-600 h-full rounded-full" style={{ width: "60%" }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}