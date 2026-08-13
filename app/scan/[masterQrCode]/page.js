"use client";
import React, { useEffect, useState, useCallback, use } from "react";
import { ShoppingCart, Plus, Minus, X, Check, Clock, ChefHat, Loader2, UtensilsCrossed, AlertCircle } from "lucide-react";

// Helper: group menu items by category
function groupByCategory(items) {
  return items.reduce((acc, item) => {
    const cat = item.category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});
}

const STATUS_STEPS = ["pending", "preparing", "ready", "served"];
const STATUS_LABELS = { pending: "Order Received", preparing: "Being Prepared", ready: "Ready to Serve!", served: "Served" };
const STATUS_COLORS = { pending: "text-amber-600", preparing: "text-blue-600", ready: "text-emerald-600", served: "text-slate-500" };

export default function CustomerStorefront({ params }) {
  const { masterQrCode } = use(params);

  // Session state
  const [session, setSession] = useState(null);    // { restaurantId, tableNumber, sessionToken, menu }
  const [sessionError, setSessionError] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  // Cart state
  const [cart, setCart] = useState([]);            // [{ menuItemId, name, price, quantity }]
  const [cartOpen, setCartOpen] = useState(false);

  // Order state
  const [placing, setPlacing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [liveOrders, setLiveOrders] = useState([]);
  const [runningTotal, setRunningTotal] = useState(0);
  const [tableId, setTableId] = useState(null);

  // Active category tab
  const [activeCategory, setActiveCategory] = useState(null);

  // ── 1. QR Scan — Claim Table ──────────────────────────────────────────
  useEffect(() => {
    async function claimTable() {
      try {
        const res = await fetch(`/api/storefront/scan/${masterQrCode}`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          setSessionError(data.message || "This table is currently unavailable.");
          return;
        }
        setSession(data.data);
        setTableId(data.data.tableId || null);
        // Set default category to first available
        const grouped = groupByCategory(data.data.menu || []);
        const firstCat = Object.keys(grouped)[0];
        setActiveCategory(firstCat || null);

        // Persist to localStorage for resilience
        localStorage.setItem("soras_session", JSON.stringify(data.data));
      } catch (err) {
        setSessionError("Network error. Please try scanning again.");
      } finally {
        setSessionLoading(false);
      }
    }
    claimTable();
  }, [masterQrCode]);

  // ── 2. Live Orders Polling ─────────────────────────────────────────────
  const fetchLiveOrders = useCallback(async () => {
    if (!session?.restaurantId || !tableId) return;
    try {
      const res = await fetch(`/api/storefront/order/live?restaurantId=${session.restaurantId}&tableId=${tableId}&sessionToken=${session.sessionToken}`);
      const data = await res.json();
      if (data.success) {
        setLiveOrders(data.data.orders || []);
        setRunningTotal(data.data.currentRunningTotal || 0);
      }
    } catch { }
  }, [session, tableId]);

  useEffect(() => {
    if (!session || !tableId) return;
    fetchLiveOrders();
    const timer = setInterval(fetchLiveOrders, 10000);
    return () => clearInterval(timer);
  }, [fetchLiveOrders, session, tableId]);

  // ── 3. Cart Logic ───────────────────────────────────────────────────────
  const addToCart = (item, portion = 'full') => {
    const cartItemId = `${item._id}-${portion}`;
    setCart(prev => {
      const existing = prev.find(c => c.cartItemId === cartItemId);
      if (existing) return prev.map(c => c.cartItemId === cartItemId ? { ...c, quantity: c.quantity + 1 } : c);
      
      const itemPrice = portion === 'half' ? Math.ceil((item.price || 0) / 2) : item.price;
      const itemName = portion === 'half' ? `${item.name} (Half)` : item.name;
      
      return [...prev, { cartItemId, menuItemId: item._id, name: itemName, price: itemPrice, quantity: 1, isVeg: item.isVeg, portion }];
    });
  };

  const removeFromCart = (cartItemId) => {
    setCart(prev => {
      const existing = prev.find(c => c.cartItemId === cartItemId);
      if (existing?.quantity === 1) return prev.filter(c => c.cartItemId !== cartItemId);
      return prev.map(c => c.cartItemId === cartItemId ? { ...c, quantity: c.quantity - 1 } : c);
    });
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const getQty = (id, portion = 'full') => cart.find(c => c.cartItemId === `${id}-${portion}`)?.quantity || 0;

  // ── 4. Place Order ─────────────────────────────────────────────────────
  const placeOrder = async () => {
    if (cart.length === 0 || !session) return;
    setPlacing(true);
    setOrderError("");
    try {
      const res = await fetch("/api/res/order/placeOrder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: session.restaurantId,
          tableNumber: session.tableNumber,
          sessionToken: session.sessionToken,
          items: cart.map(c => ({ menuItemId: c.menuItemId, quantity: c.quantity, name: c.name, price: c.price, portion: c.portion })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setOrderError(data.message || "Failed to place order. Please try again.");
        return;
      }
      setCart([]);
      setCartOpen(false);
      setOrderPlaced(true);
      setTimeout(() => setOrderPlaced(false), 3000);
      fetchLiveOrders();
    } catch (err) {
      setOrderError("Network error. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  // ── Render: Loading ────────────────────────────────────────────────────
  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-purple-600 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-600">Connecting to your table...</p>
        </div>
      </div>
    );
  }

  // ── Render: Session Error ─────────────────────────────────────────────
  if (sessionError) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl border border-rose-100 shadow-lg p-8 max-w-sm text-center">
          <AlertCircle size={40} className="text-rose-400 mx-auto mb-4" />
          <h2 className="text-lg font-black text-slate-900 mb-2">Table Unavailable</h2>
          <p className="text-sm text-slate-500 leading-relaxed">{sessionError}</p>
          <p className="text-xs text-slate-400 mt-4">Please ask staff for assistance.</p>
        </div>
      </div>
    );
  }

  const menuByCategory = groupByCategory(session?.menu || []);
  const categories = Object.keys(menuByCategory);

  return (
    <div className="min-h-screen bg-[#FAF9F6] font-sans pb-32">

      {/* ── Hero Bar ──────────────────────────────────────────────── */}
      <header className="bg-[#1E1B4B] text-white px-5 pt-8 pb-5">
        <p className="text-[10px] font-bold text-purple-300 tracking-widest uppercase mb-1">Dining at</p>
        <h1 className="text-xl font-black">Table {session.tableNumber}</h1>
        <p className="text-xs text-purple-200 mt-0.5">Scan · Order · Enjoy</p>
      </header>

      {/* ── Order Placed Confirmation ────────────────────────────── */}
      {orderPlaced && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-sm font-bold animate-bounce">
          <Check size={16} /> Order placed successfully!
        </div>
      )}

      {/* ── Live Order Tracker ───────────────────────────────────── */}
      {liveOrders.length > 0 && (
        <div className="mx-4 mt-4 bg-white border rounded-2xl p-4 shadow-sm">
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Clock size={12} /> Your Active Orders
          </h2>
          <div className="space-y-2">
            {liveOrders.map(order => (
              <div key={order._id} className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                <div>
                  <p className="text-xs font-bold text-slate-800">{order.items?.length} item(s) — ₹{order.totalAmount}</p>
                  <p className="text-[10px] text-slate-400 font-mono">#{order._id?.slice(-6)}</p>
                </div>
                <span className={`text-[10px] font-black uppercase ${STATUS_COLORS[order.orderStatus] || "text-slate-500"}`}>
                  {STATUS_LABELS[order.orderStatus] || order.orderStatus}
                </span>
              </div>
            ))}
          </div>
          {runningTotal > 0 && (
            <div className="mt-3 pt-3 border-t border-dashed border-slate-200 flex justify-between text-xs font-black text-slate-800">
              <span>Running Total</span>
              <span>₹{runningTotal}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Category Tabs ────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-[#FAF9F6]/90 backdrop-blur-sm border-b border-slate-100">
        <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition ${activeCategory === cat
                ? "bg-[#1E1B4B] text-white border-[#1E1B4B] shadow-md"
                : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Menu Items ───────────────────────────────────────────── */}
      <div className="px-4 pt-4 space-y-3">
        {activeCategory && (menuByCategory[activeCategory] || []).map(item => {
          const qty = getQty(item._id);
          return (
            <div key={item._id} className="bg-white rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3 p-3 hover:border-purple-200 transition">
              {/* Item Image / Placeholder */}
              {item.image ? (
                <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <UtensilsCrossed size={20} className="text-slate-300" />
                </div>
              )}

              {/* Item Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`w-2.5 h-2.5 rounded-sm border ${item.isVeg ? "border-emerald-500 bg-emerald-500" : "border-rose-500 bg-rose-500"}`} />
                      <h3 className="text-sm font-bold text-slate-900 capitalize truncate max-w-[160px]">{item.name}</h3>
                    </div>
                    {item.description && (
                      <p className="text-[11px] text-slate-400 line-clamp-1">{item.description}</p>
                    )}
                    <p className="text-sm font-black text-slate-800 mt-1">₹{item.price}</p>
                  </div>
                  
                  {!item.isHalfAllowed && (
                    getQty(item._id, 'full') === 0 ? (
                      <button
                        onClick={() => addToCart(item, 'full')}
                        className="flex-shrink-0 w-9 h-9 rounded-xl bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center transition shadow-sm shadow-purple-600/20"
                      >
                        <Plus size={16} />
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => removeFromCart(`${item._id}-full`)} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition">
                          <Minus size={14} className="text-slate-700" />
                        </button>
                        <span className="text-sm font-black text-slate-900 w-4 text-center">{getQty(item._id, 'full')}</span>
                        <button onClick={() => addToCart(item, 'full')} className="w-8 h-8 rounded-lg bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center transition">
                          <Plus size={14} />
                        </button>
                      </div>
                    )
                  )}
                </div>

                {/* Portion Controls */}
                {item.isHalfAllowed && (
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-4">
                    {/* Full */}
                    <div className="flex-1 flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full (₹{item.price})</span>
                      {getQty(item._id, 'full') === 0 ? (
                        <button onClick={() => addToCart(item, 'full')} className="w-full py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center transition">
                          Add Full
                        </button>
                      ) : (
                        <div className="flex items-center justify-between bg-slate-100 rounded-lg p-1">
                          <button onClick={() => removeFromCart(`${item._id}-full`)} className="w-6 h-6 rounded bg-white shadow-sm flex items-center justify-center text-slate-700"><Minus size={12} /></button>
                          <span className="text-xs font-black text-slate-900">{getQty(item._id, 'full')}</span>
                          <button onClick={() => addToCart(item, 'full')} className="w-6 h-6 rounded bg-purple-600 text-white shadow-sm flex items-center justify-center"><Plus size={12} /></button>
                        </div>
                      )}
                    </div>
                    
                    <div className="w-px h-8 bg-slate-200" />
                    
                    {/* Half */}
                    <div className="flex-1 flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Half (₹{Math.ceil((item.price||0)/2)})</span>
                      {getQty(item._id, 'half') === 0 ? (
                        <button onClick={() => addToCart(item, 'half')} className="w-full py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center transition">
                          Add Half
                        </button>
                      ) : (
                        <div className="flex items-center justify-between bg-slate-100 rounded-lg p-1">
                          <button onClick={() => removeFromCart(`${item._id}-half`)} className="w-6 h-6 rounded bg-white shadow-sm flex items-center justify-center text-slate-700"><Minus size={12} /></button>
                          <span className="text-xs font-black text-slate-900">{getQty(item._id, 'half')}</span>
                          <button onClick={() => addToCart(item, 'half')} className="w-6 h-6 rounded bg-purple-600 text-white shadow-sm flex items-center justify-center"><Plus size={12} /></button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </div>
          );
        })}
      </div>

      {/* ── Sticky Cart Button ────────────────────────────────────── */}
      {cartCount > 0 && (
        <div className="fixed bottom-5 left-4 right-4 z-30">
          <button
            onClick={() => setCartOpen(true)}
            className="w-full bg-[#1E1B4B] hover:bg-purple-900 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-between px-5 shadow-2xl shadow-purple-900/30 transition"
          >
            <span className="bg-purple-600 text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center">{cartCount}</span>
            <span className="flex items-center gap-2"><ShoppingCart size={16} /> View Cart</span>
            <span>₹{cartTotal}</span>
          </button>
        </div>
      )}

      {/* ── Cart Drawer ───────────────────────────────────────────── */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex items-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setCartOpen(false)} />

          {/* Sheet */}
          <div className="relative w-full bg-white rounded-t-3xl p-5 max-h-[85vh] flex flex-col shadow-2xl">
            {/* Handle */}
            <div className="w-10 h-1.5 bg-slate-200 rounded-full mx-auto mb-5" />
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-black text-slate-900">Your Cart</h2>
              <button onClick={() => setCartOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto space-y-3">
              {cart.map(item => (
                <div key={item.cartItemId} className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900 capitalize">{item.name}</p>
                    <p className="text-xs text-slate-400">₹{item.price} each</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => removeFromCart(item.cartItemId)} className="w-7 h-7 rounded-lg bg-white border flex items-center justify-center hover:bg-slate-100">
                      <Minus size={13} className="text-slate-700" />
                    </button>
                    <span className="text-sm font-black w-5 text-center">{item.quantity}</span>
                    <button onClick={() => addToCart({ _id: item.menuItemId, name: item.name.replace(' (Half)', ''), price: item.portion === 'half' ? item.price * 2 : item.price, isVeg: item.isVeg }, item.portion)} className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700">
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total + Place Order */}
            <div className="mt-4 pt-4 border-t border-dashed border-slate-200">
              <div className="flex justify-between text-sm font-black mb-3">
                <span>Total</span>
                <span>₹{cartTotal}</span>
              </div>
              {orderError && (
                <p className="text-xs text-rose-600 font-semibold mb-2 bg-rose-50 p-2 rounded-xl">{orderError}</p>
              )}
              <button
                disabled={placing}
                onClick={placeOrder}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black py-4 rounded-2xl text-sm flex items-center justify-center gap-2 transition"
              >
                {placing ? (
                  <><Loader2 size={16} className="animate-spin" /> Placing Order...</>
                ) : (
                  <><ChefHat size={16} /> Place Order · ₹{cartTotal}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
