"use client";
import React, { useState } from "react";
import { CheckCircle2, UserCheck, AlertCircle } from "lucide-react";

export default function TablesFloor() {
  const [tables, setTables] = useState([
    { id: "1", tableNumber: "1", status: "free", totalBill: 0, waiter: "-" },
    { id: "2", tableNumber: "2", status: "occupied", totalBill: 1650, waiter: "Rahul Kumar" },
    { id: "3", tableNumber: "3", status: "bill_requested", totalBill: 3400, waiter: "Satyam Kumar" },
    { id: "4", tableNumber: "4", status: "occupied", totalBill: 890, waiter: "Rahul Kumar" },
  ]);

  const [selectedTable, setSelectedTable] = useState(null);
  
  // Split Payment Inputs
  const [cashAmount, setCashAmount] = useState("");
  const [upiAmount, setUpiAmount] = useState("");

  const handleOpenSettleDrawer = (table) => {
    setSelectedTable(table);
    // Auto-fill entire total into UPI field as a baseline suggestion
    setUpiAmount(table.totalBill.toString());
    setCashAmount("0");
  };

  // Dynamic Calculation Logic as manager type numbers
  const currentCash = parseFloat(cashAmount) || 0;
  const currentUpi = parseFloat(upiAmount) || 0;
  const totalPaidCalculated = currentCash + currentUpi;
  const targetTotal = selectedTable?.totalBill || 0;
  const paymentMismatch = totalPaidCalculated !== targetTotal;

  const handleFinalizeSettlement = (e) => {
    e.preventDefault();
    if (paymentMismatch) return alert("❌ Absolute Balance Mismatch! Paid split totals must match grand total bill exact.");

    alert(`💸 Settlement Executed! \nCash Split: ₹${currentCash}\nUPI Split: ₹${currentUpi}\nSyncing transaction logs safely to cloud database structures.`);
    
    setTables(tables.map(t => t.id === selectedTable.id ? { ...t, status: "free", totalBill: 0, waiter: "-" } : t));
    setSelectedTable(null);
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-900">Live Dining Floor</h2>
        <p className="text-xs text-slate-400 mt-0.5">Click dynamic bill-requested cards to initialize split calculations</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {tables.map((table) => {
          let stateStyle = "bg-white border-slate-200 text-slate-800 hover:border-slate-300";
          if (table.status === "occupied") stateStyle = "bg-amber-50/40 border-amber-200 text-amber-900";
          if (table.status === "bill_requested") stateStyle = "bg-rose-50 border-rose-300 text-rose-900 shadow-md animate-pulse cursor-pointer";

          return (
            <div
              key={table.id}
              onClick={() => table.status !== "free" && handleOpenSettleDrawer(table)}
              className={`p-5 rounded-2xl border-2 transition-all flex flex-col justify-between h-36 relative ${stateStyle}`}
            >
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-slate-400 tracking-wider">TABLE</span>
                  {table.status === "bill_requested" && <span className="bg-rose-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full">DUE</span>}
                </div>
                <p className="text-3xl font-black mt-1">{table.tableNumber}</p>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-dashed border-slate-200/60 pt-2 mt-2">
                <span className="flex items-center gap-1 text-slate-400"><UserCheck size={12}/> {table.waiter}</span>
                {table.totalBill > 0 && <span className="font-bold text-slate-900">₹{table.totalBill}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* 💳 Split-Payment Drawer */}
      {selectedTable && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex justify-end z-50">
          <div className="bg-white w-full max-w-md h-full p-6 flex flex-col justify-between shadow-2xl rounded-l-3xl animate-slide-left">
            <div>
              <div className="flex justify-between items-center border-b pb-4 mb-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Table {selectedTable.tableNumber} Settlement</h3>
                  <p className="text-xs text-slate-400">Handle compound checkout matrices below</p>
                </div>
                <button onClick={() => setSelectedTable(null)} className="text-slate-400 text-sm font-bold hover:text-slate-600">✕ Close</button>
              </div>

              {/* Due Card */}
              <div className="bg-slate-900 text-white p-5 rounded-2xl mb-6 shadow-inner">
                <span className="text-xs text-slate-400 font-bold block tracking-wider uppercase">Grand Total Invoice Due</span>
                <span className="text-4xl font-black">₹{targetTotal}</span>
              </div>

              {/* Inputs Split Forms Container */}
              <form onSubmit={handleFinalizeSettlement} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Cash Collection Amount (₹)</label>
                  <input
                    type="number"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-hidden focus:border-purple-600"
                    placeholder="Enter cash component received"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">UPI Electronic Amount (₹)</label>
                  <input
                    type="number"
                    value={upiAmount}
                    onChange={(e) => setUpiAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-hidden focus:border-purple-600"
                    placeholder="Enter UPI component received"
                  />
                </div>

                {/* Real-time Math Auditing Box */}
                <div className={`p-4 rounded-xl border flex items-start gap-3 mt-4 ${paymentMismatch ? "bg-rose-50 border-rose-200 text-rose-900" : "bg-emerald-50 border-emerald-200 text-emerald-900"}`}>
                  {paymentMismatch ? <AlertCircle size={18} className="mt-0.5 text-rose-600"/> : <CheckCircle2 size={18} className="mt-0.5 text-emerald-600"/>}
                  <div>
                    <p className="text-xs font-bold">Sum Collected: ₹{totalPaidCalculated}</p>
                    <p className="text-[11px] opacity-80 mt-0.5">
                      {paymentMismatch 
                        ? `Awaiting exact reconciliation. Difference: ₹${targetTotal - totalPaidCalculated}` 
                        : "Totals align exactly! Safe to commit settlement vector."}
                    </p>
                  </div>
                </div>
              </form>
            </div>

            <button
              disabled={paymentMismatch}
              onClick={handleFinalizeSettlement}
              className={`w-full py-3.5 rounded-xl font-bold text-sm transition text-center ${
                paymentMismatch ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/10"
              }`}
            >
              Complete Account Settlement
            </button>
          </div>
        </div>
      )}
    </div>
  );
}