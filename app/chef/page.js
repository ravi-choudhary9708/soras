"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import UserProfileDropdown from "@/app/components/dashboard/userProfile/page";
import { CheckCircle2, ChefHat, UtensilsCrossed, Clock, Loader2 } from "lucide-react";
import { fetchWithAuth } from "@/utils/fetchWithAuth";

const STATUS_COLORS = {
  pending: "border-l-amber-400 bg-amber-50/60",
  preparing: "border-l-blue-400 bg-blue-50/60",
  ready: "border-l-emerald-400 bg-emerald-50/60",
};

const STATUS_BADGES = {
  pending: "bg-amber-100 text-amber-700",
  preparing: "bg-blue-100 text-blue-700",
  ready: "bg-emerald-100 text-emerald-700",
};

export default function ChefDashboard() {
  const [orders, setOrders] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const lastPlayedMinuteRef = useRef(-1);

  // Fetch logged-in staff/manager profile
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

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetchWithAuth("/api/staff/orders/pending");
      const data = await res.json();
      if (data.success) {
        // Chefs don't need to see orders that are already ready (unless we want to show history)
        const chefOrders = data.data.filter(o => o.orderStatus !== 'ready');
        setOrders(chefOrders);
        processSmartAlerts(chefOrders);
      }
    } catch (err) {
      console.error("Sync error", err);
    }
  }, []);

  const processSmartAlerts = (pendingList) => {
    if (pendingList.length === 0) return;
    const oldestOrder = pendingList[0];
    const age = oldestOrder.minutesOld;
    const currentMinute = new Date().getMinutes();

    if (age < 5) return;

    if (age >= 5 && age < 10) {
      if (currentMinute !== lastPlayedMinuteRef.current) {
        lastPlayedMinuteRef.current = currentMinute;
        if (currentUser?.role === "chef") playNotificationSound("/sounds/gentle-nudge.mp3");
      }
    }

    if (age >= 10) {
      if (currentMinute !== lastPlayedMinuteRef.current) {
        lastPlayedMinuteRef.current = currentMinute;
        playNotificationSound("/sounds/urgent-siren.mp3");
      }
    }
  };

  const playNotificationSound = (src) => {
    const audio = new Audio(src);
    audio.volume = 0.8;
    audio.play().catch(() => {});
  };

  useEffect(() => {
    fetchOrders();
    const poller = setInterval(fetchOrders, 15000);
    return () => clearInterval(poller);
  }, [fetchOrders]);

  const handleLogoutSuccess = () => {
    window.location.href = "/auth";
  };

  const setLoading = (orderId, loading) =>
    setActionLoading(prev => ({ ...prev, [orderId]: loading }));

  const approveOrder = async (orderId) => {
    setLoading(orderId, "approving");
    try {
      const res = await fetchWithAuth(`/api/res/order/verify/${orderId}`, { method: "PATCH" });
      if (res.ok) await fetchOrders();
    } catch (err) {
      console.error("Approve error", err);
    } finally {
      setLoading(orderId, null);
    }
  };

  const markReady = async (orderId) => {
    setLoading(orderId, "ready");
    try {
      const res = await fetchWithAuth(`/api/res/order/makeOrderReady/${orderId}`, { method: "PUT" });
      if (res.ok) await fetchOrders();
    } catch (err) {
      console.error("Mark ready error", err);
    } finally {
      setLoading(orderId, null);
    }
  };

  const markServed = async (orderId) => {
    setLoading(orderId, "served");
    try {
      const res = await fetchWithAuth(`/api/res/order/makeOrderServed/${orderId}`, { method: "PUT" });
      if (res.ok) await fetchOrders();
    } catch (err) {
      console.error("Mark served error", err);
    } finally {
      setLoading(orderId, null);
    }
  };

  // Group orders by table number for spatial awareness
  const grouped = orders.reduce((acc, order) => {
    const tableLabel = order.tableId?.tableNumber ? `Table ${order.tableId.tableNumber}` : "Unknown Table";
    if (!acc[tableLabel]) acc[tableLabel] = [];
    acc[tableLabel].push(order);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-slate-200 flex flex-col">

      {/* ─── Sticky Top Header ─── */}
      <header className="sticky top-0 z-10 bg-[#141414]/90 backdrop-blur-md border-b border-[#2A2A2A] shadow-sm px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-sm font-black text-white">SORAS KOT</h1>
          <p className="text-[11px] text-orange-500 font-medium tracking-widest uppercase">Chef Dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-orange-500 bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-full">
            {orders.length} active orders
          </span>
          <UserProfileDropdown
            currentUser={currentUser}
            onLogoutSuccess={handleLogoutSuccess}
          />
        </div>
      </header>

      {/* ─── Order Cards ─── */}
      <div className="flex-1 p-4 space-y-6">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <ChefHat size={40} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">Kitchen is all clear!</p>
            <p className="text-xs mt-1">New orders will appear here automatically.</p>
          </div>
        ) : (
          Object.entries(grouped).map(([tableLabel, tableOrders]) => (
            <div key={tableLabel}>
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-5 h-5 bg-[#2A2A2A] rounded-md flex items-center justify-center text-[10px]">🔥</span>
                {tableLabel}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {tableOrders.map(order => {
                  const isLoading = actionLoading[order._id];
                  const urgency = order.minutesOld >= 10 ? "red" : order.minutesOld >= 5 ? "orange" : "green";
                  const urgencyBorder = urgency === "red" ? "border-l-red-500" : urgency === "orange" ? "border-l-orange-500" : "border-l-blue-500";
                  
                  return (
                    <div
                      key={order._id}
                      className={`bg-[#202020] rounded-2xl border border-[#2A2A2A] border-l-4 shadow-lg p-4 transition-all ${urgencyBorder} ${urgency === "red" ? "animate-pulse" : ""}`}
                    >
                      {/* Order Header */}
                      <div className="flex items-start justify-between mb-3 border-b border-[#2A2A2A] pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${order.orderStatus === 'preparing' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                              {order.orderStatus}
                            </span>
                            {order.isVerified && (
                              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-full">Verified</span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1 font-mono">#{order._id?.slice(-6)}</p>
                        </div>
                        <div className={`flex items-center gap-1 text-xs font-black ${urgency === "red" ? "text-red-400" : urgency === "orange" ? "text-orange-400" : "text-blue-400"}`}>
                          <Clock size={12} />
                          {order.minutesOld}m ago
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="bg-[#1A1A1A] rounded-xl p-3 mb-4 space-y-2 border border-[#2A2A2A]">
                        {(order.items || []).map((item, i) => (
                          <div key={i} className="flex justify-between items-start text-xs text-slate-300">
                            <span className="font-medium capitalize text-white flex-1">{item.name}</span>
                            <span className="font-black text-orange-500 ml-2 bg-orange-500/10 px-2 rounded">× {item.quantity}</span>
                          </div>
                        ))}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-auto">
                        {order.orderStatus === "pending" && !order.isVerified && (currentUser?.role === 'staff' || currentUser?.role === 'manager') && (
                          <button
                            disabled={!!isLoading}
                            onClick={() => approveOrder(order._id)}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600/80 hover:bg-emerald-600 disabled:bg-[#2A2A2A] disabled:text-slate-600 text-white text-xs font-bold py-3 rounded-xl transition"
                          >
                            {isLoading === "approving" ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                            Verify
                          </button>
                        )}
                        {(order.orderStatus === "preparing" || (order.orderStatus === "pending" && order.isVerified)) && (currentUser?.role === 'chef' || currentUser?.role === 'manager') && (
                          <button
                            disabled={!!isLoading}
                            onClick={() => markReady(order._id)}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-orange-600 hover:bg-orange-500 disabled:bg-[#2A2A2A] disabled:text-slate-600 text-white text-xs font-bold py-3 rounded-xl transition shadow-lg shadow-orange-900/20"
                          >
                            {isLoading === "ready" ? <Loader2 size={13} className="animate-spin" /> : <ChefHat size={13} />}
                            Food is Ready
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
