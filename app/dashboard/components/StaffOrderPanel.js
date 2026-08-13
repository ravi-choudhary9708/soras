"use client";
import { useState, useEffect, useCallback } from "react";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { Search, Plus, Minus, Trash2, Send, ChefHat, Loader2, X, CheckCircle2 } from "lucide-react";

export default function StaffOrderPanel() {
    const [menuItems, setMenuItems] = useState([]);
    const [cart, setCart] = useState([]); // [{ menuItemId, name, price, quantity, portion, isHalfAllowed }]
    const [tableNumber, setTableNumber] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("all");
    const [loading, setLoading] = useState(true);
    const [placing, setPlacing] = useState(false);
    const [feedback, setFeedback] = useState({ type: "", message: "" });

    const fetchMenu = useCallback(async () => {
        try {
            const res = await fetchWithAuth("/api/res/menu?isAvailable=true");
            const data = await res.json();
            if (data.success) setMenuItems(data.data);
        } catch (err) {
            console.error("Error fetching menu:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchMenu(); }, [fetchMenu]);

    const categories = ["all", ...new Set(menuItems.map(i => i.category).filter(Boolean))];

    const filtered = menuItems.filter(item => {
        const matchesCategory = activeCategory === "all" || item.category === activeCategory;
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const addToCart = (item, portion = "full") => {
        const price = portion === "half" ? Math.ceil(item.price / 2) : item.price;
        const key = `${item._id}_${portion}`;
        setCart(prev => {
            const existing = prev.find(c => c._key === key);
            if (existing) {
                return prev.map(c => c._key === key ? { ...c, quantity: c.quantity + 1 } : c);
            }
            return [...prev, {
                _key: key,
                menuItemId: item._id,
                name: item.name,
                price,
                quantity: 1,
                portion,
                isHalfAllowed: item.isHalfAllowed,
            }];
        });
    };

    const updateQty = (key, delta) => {
        setCart(prev => prev
            .map(c => c._key === key ? { ...c, quantity: c.quantity + delta } : c)
            .filter(c => c.quantity > 0)
        );
    };

    const removeFromCart = (key) => setCart(prev => prev.filter(c => c._key !== key));

    const cartTotal = cart.reduce((acc, c) => acc + c.price * c.quantity, 0);

    const placeOrder = async () => {
        if (!tableNumber || cart.length === 0) {
            setFeedback({ type: "error", message: "Please enter a table number and add items." });
            return;
        }
        setPlacing(true);
        setFeedback({ type: "", message: "" });
        try {
            const res = await fetchWithAuth("/api/staff/order/place", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tableNumber: Number(tableNumber),
                    items: cart.map(c => ({
                        menuItemId: c.menuItemId,
                        name: c.name,
                        price: c.price,
                        quantity: c.quantity,
                        portion: c.portion,
                    }))
                })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setFeedback({ type: "success", message: `✅ Order sent to KOT for Table ${tableNumber}!` });
                setCart([]);
                setTableNumber("");
            } else {
                setFeedback({ type: "error", message: data.message || "Failed to place order." });
            }
        } catch (err) {
            setFeedback({ type: "error", message: "Network error. Please try again." });
        } finally {
            setPlacing(false);
        }
    };

    return (
        <div className="flex h-full gap-4 p-4">
            {/* ── Left: Menu Browser ── */}
            <div className="flex-1 flex flex-col gap-3 min-w-0">
                {/* Search */}
                <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search menu items..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-amber-400 transition"
                    />
                </div>

                {/* Category Pills */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-full capitalize transition ${activeCategory === cat ? "bg-amber-500 text-white" : "bg-white border border-slate-200 text-slate-500 hover:border-amber-400"}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Menu Grid */}
                {loading ? (
                    <div className="flex items-center justify-center h-40 text-slate-400">
                        <Loader2 size={24} className="animate-spin mr-2" /> Loading menu...
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto">
                        {filtered.map(item => {
                            const inCart = cart.filter(c => c.menuItemId === item._id);
                            return (
                                <div key={item._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 flex flex-col gap-2">
                                    {item.imageUrl && (
                                        <img src={item.imageUrl} alt={item.name} className="w-full h-24 object-cover rounded-xl" />
                                    )}
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-slate-800 capitalize leading-tight">{item.name}</p>
                                        <p className="text-xs text-slate-400 capitalize">{item.category}</p>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-black text-amber-600">₹{item.price}</span>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => addToCart(item, "full")}
                                            className="flex-1 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-white py-1.5 rounded-lg transition flex items-center justify-center gap-1"
                                        >
                                            <Plus size={11} /> Full
                                        </button>
                                        {item.isHalfAllowed && (
                                            <button
                                                onClick={() => addToCart(item, "half")}
                                                className="flex-1 text-xs font-bold bg-orange-100 hover:bg-orange-200 text-orange-700 py-1.5 rounded-lg transition flex items-center justify-center gap-1"
                                            >
                                                <Plus size={11} /> Half
                                            </button>
                                        )}
                                    </div>
                                    {inCart.length > 0 && (
                                        <p className="text-[10px] text-center text-emerald-600 font-bold">
                                            {inCart.reduce((a, c) => a + c.quantity, 0)} in cart
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                        {filtered.length === 0 && (
                            <div className="col-span-full text-center py-12 text-slate-400">
                                <ChefHat size={32} className="mx-auto mb-2 opacity-30" />
                                <p className="text-sm font-medium">No items found.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── Right: Cart & Order ── */}
            <div className="w-80 flex-shrink-0 flex flex-col gap-3">
                {/* Table Number */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Table Number</label>
                    <input
                        type="number"
                        min="1"
                        placeholder="e.g. 5"
                        value={tableNumber}
                        onChange={e => setTableNumber(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold outline-none focus:border-amber-400 transition"
                    />
                </div>

                {/* Cart */}
                <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-3 overflow-hidden">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Order Items</h3>
                        {cart.length > 0 && (
                            <button onClick={() => setCart([])} className="text-[10px] text-rose-400 hover:text-rose-600 font-bold flex items-center gap-1 transition">
                                <X size={11} /> Clear
                            </button>
                        )}
                    </div>

                    {cart.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                            <ChefHat size={32} className="mb-2" />
                            <p className="text-xs font-medium">No items added yet</p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto space-y-2">
                            {cart.map(c => (
                                <div key={c._key} className="flex items-center gap-2 bg-slate-50 rounded-xl p-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-slate-700 capitalize truncate">{c.name}</p>
                                        <p className="text-[10px] text-slate-400 capitalize">{c.portion} · ₹{c.price}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => updateQty(c._key, -1)} className="w-6 h-6 bg-white border border-slate-200 rounded-lg flex items-center justify-center hover:bg-rose-50 transition">
                                            <Minus size={10} />
                                        </button>
                                        <span className="text-xs font-black w-5 text-center">{c.quantity}</span>
                                        <button onClick={() => updateQty(c._key, 1)} className="w-6 h-6 bg-white border border-slate-200 rounded-lg flex items-center justify-center hover:bg-emerald-50 transition">
                                            <Plus size={10} />
                                        </button>
                                    </div>
                                    <span className="text-xs font-black text-amber-600 w-12 text-right">₹{c.price * c.quantity}</span>
                                    <button onClick={() => removeFromCart(c._key)} className="text-slate-300 hover:text-rose-400 transition">
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Total & Place Order */}
                    <div className="border-t border-slate-100 pt-3 space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-500">{cart.length} item type(s)</span>
                            <span className="text-base font-black text-slate-800">₹{cartTotal}</span>
                        </div>

                        {feedback.message && (
                            <div className={`p-2.5 rounded-xl text-xs font-semibold text-center ${feedback.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}>
                                {feedback.message}
                            </div>
                        )}

                        <button
                            onClick={placeOrder}
                            disabled={placing || cart.length === 0 || !tableNumber}
                            className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-black py-3 rounded-xl transition shadow-md shadow-amber-200"
                        >
                            {placing ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                            {placing ? "Sending to KOT..." : "Send to KOT"}
                        </button>
                        <p className="text-[10px] text-center text-slate-400">
                            Staff orders go directly to the chef — no customer approval needed.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
