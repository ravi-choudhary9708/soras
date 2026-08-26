"use client";
import React, { useState, useEffect } from "react";
import { TrendingUp, ShoppingBag, IndianRupee, Loader2, BarChart2 } from "lucide-react";
import { fetchWithAuth } from "@/utils/fetchWithAuth";

export default function Sales() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetchWithAuth("/api/res/order?limit=100");
        const data = await res.json();
        if (data.success) setOrders(data.data.orders || []);
      } catch (err) {
        console.error("Error fetching sales data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // Compute stats from real orders
  const paidOrders = orders.filter(o => o.PaymentStatus === "paid");
  const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const upiRevenue = paidOrders.filter(o => o.paymentMode === "upi").reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const cashRevenue = paidOrders.filter(o => o.paymentMode === "cash").reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // Top items computation
  const itemCounts = {};
  for (const order of orders) {
    for (const item of (order.items || [])) {
      const name = item.name || "Unknown";
      itemCounts[name] = (itemCounts[name] || 0) + (item.quantity || 1);
    }
  }
  const topItems = Object.entries(itemCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
  const maxCount = topItems[0]?.[1] || 1;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <Loader2 className="animate-spin mr-2" size={20} /> Loading sales data...
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-900">Sales & Analytics</h2>
        <p className="text-xs text-slate-400 mt-0.5">Real-time revenue from completed orders</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 border rounded-2xl shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <IndianRupee size={11} /> Total Revenue
          </p>
          <p className="text-3xl font-black text-slate-900 mt-1">₹{totalRevenue.toLocaleString("en-IN")}</p>
          <p className="text-[10px] text-slate-400 mt-1">{paidOrders.length} paid orders</p>
        </div>
        <div className="bg-white p-5 border rounded-2xl shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <BarChart2 size={11} /> UPI Collections
          </p>
          <p className="text-3xl font-black text-purple-600 mt-1">₹{upiRevenue.toLocaleString("en-IN")}</p>
          <p className="text-[10px] text-slate-400 mt-1">{paidOrders.filter(o => o.paymentMode === "upi").length} UPI orders</p>
        </div>
        <div className="bg-white p-5 border rounded-2xl shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <ShoppingBag size={11} /> Cash Register
          </p>
          <p className="text-3xl font-black text-emerald-600 mt-1">₹{cashRevenue.toLocaleString("en-IN")}</p>
          <p className="text-[10px] text-slate-400 mt-1">{paidOrders.filter(o => o.paymentMode === "cash").length} cash orders</p>
        </div>
      </div>

      {/* Top Items */}
      <div className="bg-white border rounded-2xl p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <TrendingUp size={16} className="text-purple-600" /> Top Ordered Items
        </h3>
        {topItems.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">No order data yet. Orders will appear here once placed.</p>
        ) : (
          <div className="space-y-4">
            {topItems.map(([name, count]) => (
              <div key={name}>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="capitalize">{name}</span>
                  <span className="text-slate-400">{count} ordered</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-purple-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order Status Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        {[
          { label: "Pending", status: "pending", color: "bg-yellow-100 text-yellow-700" },
          { label: "Preparing", status: "preparing", color: "bg-blue-100 text-blue-700" },
          { label: "Completed", status: "completed", color: "bg-emerald-100 text-emerald-700" },
        ].map(({ label, status, color }) => (
          <div key={status} className="bg-white border rounded-2xl p-4 shadow-xs text-center">
            <p className="text-xs text-slate-400 font-bold uppercase">{label}</p>
            <p className="text-2xl font-black mt-1">{orders.filter(o => o.orderStatus === status).length}</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${color}`}>{status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}