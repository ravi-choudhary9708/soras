"use client";
import React, { useState } from "react";
import { Send, QrCode } from "lucide-react";

export default function SorasPayment() {
  const [utr, setUtr] = useState("");

  return (
    <div className="max-w-md">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-900">Soras Licensing Portal</h2>
        <p className="text-xs text-slate-400 mt-0.5">Renew SaaS core processing capabilities directly with platform founder</p>
      </div>

      <div className="bg-white border rounded-2xl p-5 shadow-xs space-y-5">
        <div className="bg-purple-50/60 border border-purple-100 rounded-xl p-4 text-center">
          <p className="text-[10px] uppercase font-bold tracking-wider text-purple-600 mb-1">Direct Settlement UPI Key</p>
          <p className="text-xl font-black text-purple-900 tracking-tight">purnima@ybl</p>
          <p className="text-[11px] text-slate-400 mt-1">Submit your 12-digit UPI transaction reference ID (UTR) below for manual verification.</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Target Lifespan Matrix</label>
            <select className="w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-xs font-bold outline-hidden focus:border-purple-600">
              <option>1 Month Production Seat — ₹999</option>
              <option>3 Month Production Seat — ₹2,499</option>
              <option>1 Year Production Seat — ₹7,999</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Transaction reference id (UTR)</label>
            <input
              type="text"
              required
              value={utr}
              onChange={(e) => setUtr(e.target.value)}
              placeholder="Enter 12-digit transaction index number"
              className="w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-xs font-mono outline-hidden focus:border-purple-600"
            />
          </div>
        </div>

        <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-md shadow-purple-600/10">
          <Send size={14}/> Dispatch Verification Payload
        </button>
      </div>
    </div>
  );
}