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

export default function TerminalDashboard() {
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
        setOrders(data.data);
        processSmartAlerts(data.data);
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
        if (currentUser?.role === "staff") playNotificationSound("/sounds/gentle-nudge.mp3");
        if (currentUser?.role === "manager") playNotificationSound("/sounds/manager-alert.mp3");
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
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col">

      {/* ─── Sticky Top Header ─── */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-sm font-black text-slate-700">SORAS</h1>
          <p className="text-[11px] text-slate-400 font-medium">Staff Order Terminal</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
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
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <UtensilsCrossed size={40} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">No active orders right now.</p>
            <p className="text-xs mt-1">New orders will appear here automatically.</p>
          </div>
        ) : (
          Object.entries(grouped).map(([tableLabel, tableOrders]) => (
            <div key={tableLabel}>
              <h2 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-5 h-5 bg-slate-200 rounded-md flex items-center justify-center text-[10px]">🍽</span>
                {tableLabel}
              </h2>
              <div className="space-y-3">
                {tableOrders.map(order => {
                  const isLoading = actionLoading[order._id];
                  const urgency = order.minutesOld >= 10 ? "red" : order.minutesOld >= 5 ? "orange" : "green";

                  return (
                    <div
                      key={order._id}
                      className={`bg-white rounded-2xl border-l-4 shadow-sm p-4 transition-all ${STATUS_COLORS[order.orderStatus] || "border-l-slate-300"} ${urgency === "red" ? "animate-pulse" : ""}`}
                    >
                      {/* Order Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${STATUS_BADGES[order.orderStatus] || "bg-slate-100 text-slate-600"}`}>
                              {order.orderStatus}
                            </span>
                            {order.isVerified && (
                              <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">Verified</span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1 font-mono">#{order._id?.slice(-6)}</p>
                        </div>
                        <div className={`flex items-center gap-1 text-xs font-black ${urgency === "red" ? "text-red-600" : urgency === "orange" ? "text-orange-500" : "text-emerald-600"}`}>
                          <Clock size={12} />
                          {order.minutesOld}m ago
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="bg-slate-50 rounded-xl p-3 mb-3 space-y-1">
                        {(order.items || []).map((item, i) => (
                          <div key={i} className="flex justify-between text-xs text-slate-700">
                            <span className="font-medium capitalize">{item.name} <span className="text-slate-400">× {item.quantity}</span></span>
                            <span className="font-bold">₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                        <div className="border-t border-slate-200 pt-1 mt-1 flex justify-between text-xs font-black">
                          <span>Total</span>
                          <span>₹{order.totalAmount}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        {order.orderStatus === "pending" && !order.isVerified && (
                          <button
                            disabled={!!isLoading}
                            onClick={() => approveOrder(order._id)}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold py-2.5 rounded-xl transition"
                          >
                            {isLoading === "approving" ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                            Approve Order
                          </button>
                        )}
                        {(order.orderStatus === "preparing" || (order.orderStatus === "pending" && order.isVerified)) && (
                          <button
                            disabled={!!isLoading}
                            onClick={() => markReady(order._id)}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold py-2.5 rounded-xl transition"
                          >
                            {isLoading === "ready" ? <Loader2 size={13} className="animate-spin" /> : <ChefHat size={13} />}
                            Mark Ready
                          </button>
                        )}
                        {order.orderStatus === "ready" && (
                          <button
                            disabled={!!isLoading}
                            onClick={() => markServed(order._id)}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold py-2.5 rounded-xl transition"
                          >
                            {isLoading === "served" ? <Loader2 size={13} className="animate-spin" /> : <UtensilsCrossed size={13} />}
                            Mark Served
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