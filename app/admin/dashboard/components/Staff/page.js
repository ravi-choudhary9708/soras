"use client";
import React, { useState } from "react";
import { UserPlus, Shield } from "lucide-react";

export default function Staff() {
  const [servers, setServers] = useState([
    { name: "Rahul Kumar", role: "waiter", email: "rahul@soras.in", baselinePin: "2044" },
    { name: "Satyam Kumar", role: "waiter", email: "satyam@soras.in", baselinePin: "9021" },
  ]);

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-900">Staff Ingestion Hub</h2>
        <p className="text-xs text-slate-400 mt-0.5">Register new floor waiters and control authentication pins</p>
      </div>

      <div className="bg-white border rounded-2xl p-5 shadow-xs mb-6">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2"><UserPlus size={16}/> Onboard New Server</h3>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <input type="text" placeholder="Server Full Name" className="bg-slate-50 border rounded-xl px-4 py-2.5 text-xs outline-hidden focus:border-purple-600" />
          <input type="email" placeholder="Email Reference" className="bg-slate-50 border rounded-xl px-4 py-2.5 text-xs outline-hidden focus:border-purple-600" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input type="password" maxLength={4} placeholder="Secure 4-Digit Terminal PIN" className="bg-slate-50 border rounded-xl px-4 py-2.5 text-xs outline-hidden focus:border-purple-600" />
          <button className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition">Commit Credentials</button>
        </div>
      </div>

      <div className="bg-white border rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/70 border-b text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="p-4">Staff Name</th>
              <th className="p-4">Email Mapping</th>
              <th className="p-4">Access Role</th>
              <th className="p-4 text-right">Terminal PIN</th>
            </tr>
          </thead>
          <tbody className="divide-y text-xs font-medium text-slate-700">
            {servers.map((s, idx) => (
              <tr key={idx} className="hover:bg-slate-50/40">
                <td className="p-4 font-bold text-slate-900">{s.name}</td>
                <td className="p-4 text-slate-400 font-mono">{s.email}</td>
                <td className="p-4"><span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold uppercase text-[10px] tracking-wide">{s.role}</span></td>
                <td className="p-4 text-right font-mono text-slate-400">••••</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}