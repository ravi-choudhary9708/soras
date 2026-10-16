"use client";
import React, { useState, useEffect, useCallback } from "react";
import { CheckCircle2, UserCheck, AlertCircle, RefreshCw, XCircle, DollarSign, Loader2, QrCode, Download, Printer } from "lucide-react";
import { fetchWithAuth } from "@/utils/fetchWithAuth";

export default function TablesFloor() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableOrders, setTableOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [paymentMode, setPaymentMode] = useState("cash");
  const [settling, setSettling] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [qrModalTable, setQrModalTable] = useState(null);
  const [downloadingTableId, setDownloadingTableId] = useState(null);

  const openQrModal = (e, table) => {
    e.stopPropagation();
    setQrModalTable(table);
  };

  const handleDownloadQr = async (e, table) => {
    e.stopPropagation();
    if (!table.qrCodeUrl) {
      alert("No QR code available for this table.");
      return;
    }
    setDownloadingTableId(table._id);
    try {
      const response = await fetch(table.qrCodeUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `Soras_Table_${table.tableNumber}_QR.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      // Direct fallback if fetch/CORS is restricted
      window.open(table.qrCodeUrl, "_blank");
    } finally {
      setDownloadingTableId(null);
    }
  };

  const handlePrintQr = () => {
    const printable = document.getElementById("printable-table-qr");
    if (!printable) {
      window.print();
      return;
    }
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.print();
      return;
    }
    printWindow.document.write(`
      <html>
        <head>
          <title>Table ${qrModalTable.tableNumber} QR Code</title>
          <style>
            body { display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: sans-serif; text-align: center; background: #fff; }
            .card { border: 2px solid #0f172a; padding: 24px; border-radius: 24px; max-width: 260px; box-sizing: border-box; }
            img { width: 180px; height: 180px; object-fit: contain; }
          </style>
        </head>
        <body>
          <div class="card">
            ${printable.innerHTML}
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const fetchTables = useCallback(async () => {
    try {
      const res = await fetchWithAuth("/api/manager/table");
      const data = await res.json();
      if (data.success) setTables(data.data);
    } catch (err) {
      console.error("Error fetching tables:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTables();
    const interval = setInterval(fetchTables, 15000);
    return () => clearInterval(interval);
  }, [fetchTables]);

  const openSettleDrawer = async (table) => {
    setSelectedTable(table);
    setPaymentMode("cash");
    setFeedback("");
    setOrdersLoading(true);
    try {
      const res = await fetchWithAuth(`/api/res/order?tableId=${table._id}&status=active`);
      const data = await res.json();
      if (data.success) setTableOrders(data.data.orders || []);
    } catch (err) {
      console.error("Error fetching table orders:", err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const totalBill = tableOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const handleSettle = async () => {
    if (!selectedTable || tableOrders.length === 0) return;
    setSettling(true);
    try {
      const res = await fetchWithAuth(`/api/manager/table/settle/${selectedTable._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          cashPaid: paymentMode === "cash" ? totalBill : 0, 
          upiPaid: paymentMode === "upi" ? totalBill : 0 
        })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setFeedback("✅ Table settled successfully!");
        setTimeout(() => {
          setSelectedTable(null);
          setTableOrders([]);
          fetchTables();
        }, 1200);
      } else {
        setFeedback(`❌ ${data.message || "Settlement failed. Please try again."}`);
      }
    } catch (err) {
      setFeedback("❌ Settlement failed due to a network error.");
    } finally {
      setSettling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <Loader2 className="animate-spin mr-2" size={20} /> Loading floor layout...
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Live Dining Floor</h2>
          <p className="text-xs text-slate-400 mt-0.5">Click occupied tables to view bills and settle</p>
        </div>
        <button
          onClick={fetchTables}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-700 border rounded-xl px-3 py-2 hover:bg-slate-50 transition"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {tables.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="font-bold">No tables found.</p>
          <p className="text-xs mt-1">Generate QR codes to provision tables.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {tables.map((table) => {
            const isOccupied = table.status === "occupied";
            const isFree = table.status === "free";
            let stateStyle = "bg-white border-slate-200 text-slate-800 hover:border-slate-300";
            if (isOccupied) stateStyle = "bg-amber-50/40 border-amber-300 text-amber-900 cursor-pointer hover:border-amber-400";

            return (
              <div
                key={table._id}
                onClick={() => isOccupied && openSettleDrawer(table)}
                className={`p-5 rounded-2xl border-2 transition-all flex flex-col justify-between h-40 relative ${stateStyle}`}
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-slate-400 tracking-wider">TABLE</span>
                    <div className="flex items-center gap-1.5">
                      {table.qrCodeUrl && (
                        <button
                          type="button"
                          onClick={(e) => openQrModal(e, table)}
                          title="View & Download Table QR"
                          className="px-2 py-0.5 rounded-md bg-purple-50 hover:bg-purple-100 text-purple-700 transition flex items-center gap-1 text-[10px] font-bold border border-purple-200/60"
                        >
                          <QrCode size={11} />
                          <span>QR</span>
                        </button>
                      )}
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${isOccupied ? "bg-amber-500 text-white" : "bg-emerald-100 text-emerald-700"}`}>
                        {isOccupied ? "OCCUPIED" : "FREE"}
                      </span>
                    </div>
                  </div>
                  <p className="text-3xl font-black mt-1">{table.tableNumber}</p>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-dashed border-slate-200/60 pt-2 mt-2">
                  <span className="flex items-center gap-1 text-slate-400">
                    <UserCheck size={12} /> {table.room || "main"}
                  </span>
                  <div className="flex items-center gap-2">
                    {table.qrCodeUrl && (
                      <button
                        type="button"
                        disabled={downloadingTableId === table._id}
                        onClick={(e) => handleDownloadQr(e, table)}
                        title="Direct Download QR Code"
                        className="text-slate-400 hover:text-purple-600 transition flex items-center gap-1 text-[11px] font-bold"
                      >
                        {downloadingTableId === table._id ? (
                          <Loader2 size={12} className="animate-spin text-purple-600" />
                        ) : (
                          <Download size={12} />
                        )}
                        <span className="hidden sm:inline">{downloadingTableId === table._id ? "Saving..." : "Save QR"}</span>
                      </button>
                    )}
                    {isOccupied && <span className="text-xs font-bold text-amber-600">Settle</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Settlement Drawer */}
      {selectedTable && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex justify-end z-50">
          <div className="bg-white w-full sm:max-w-md h-full p-4 sm:p-6 flex flex-col shadow-2xl sm:rounded-l-3xl">
            <div className="flex justify-between items-center border-b pb-4 mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-900">Table {selectedTable.tableNumber} — Settle Bill</h3>
                <p className="text-xs text-slate-400">{selectedTable.room}</p>
              </div>
              <button onClick={() => setSelectedTable(null)} className="text-slate-400 hover:text-slate-600 transition">
                <XCircle size={22} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4">
              {ordersLoading ? (
                <div className="flex items-center justify-center h-32 text-slate-400">
                  <Loader2 className="animate-spin mr-2" size={18} /> Loading orders...
                </div>
              ) : tableOrders.length === 0 ? (
                <div className="text-center text-slate-400 py-8">
                  <p className="font-semibold text-sm">No active orders found for this table.</p>
                </div>
              ) : (
                <>
                  <div className="bg-slate-900 text-white p-5 rounded-2xl">
                    <span className="text-xs text-slate-400 font-bold block tracking-wider uppercase">Grand Total</span>
                    <span className="text-4xl font-black">₹{totalBill}</span>
                  </div>

                  <div className="space-y-2">
                    {tableOrders.map((order) => (
                      <div key={order._id} className="bg-slate-50 rounded-xl p-3 text-xs">
                        <div className="flex justify-between font-bold text-slate-700">
                          <span>{order.items?.length} item(s)</span>
                          <span>₹{order.totalAmount}</span>
                        </div>
                        <div className="mt-1 space-y-0.5 text-slate-400">
                          {order.items?.map((item, i) => (
                            <div key={i} className="flex justify-between">
                              <span>{item.name} × {item.quantity}</span>
                              <span>₹{item.price * item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-2 uppercase tracking-wide">Payment Mode</label>
                    <div className="flex gap-2">
                      {["cash", "upi"].map(mode => (
                        <button
                          key={mode}
                          onClick={() => setPaymentMode(mode)}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition ${paymentMode === mode ? "bg-purple-600 border-purple-600 text-white" : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300"}`}
                        >
                          {mode.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {feedback && (
                <div className={`p-3 rounded-xl text-xs font-semibold text-center ${feedback.startsWith("✅") ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                  {feedback}
                </div>
              )}
            </div>

            <button
              disabled={settling || tableOrders.length === 0 || ordersLoading}
              onClick={handleSettle}
              className="mt-4 w-full py-3.5 rounded-xl font-bold text-sm transition text-center flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 disabled:text-slate-400 text-white shadow-md shadow-purple-600/10"
            >
              {settling ? <Loader2 className="animate-spin" size={16} /> : <DollarSign size={16} />}
              {settling ? "Processing..." : `Settle ₹${totalBill}`}
            </button>
          </div>
        </div>
      )}

      {/* 📱 QR Code Preview & Download Modal */}
      {qrModalTable && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl relative border border-slate-100">
            <button
              onClick={() => setQrModalTable(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition"
            >
              <XCircle size={20} />
            </button>

            <div className="mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200/50">
                Official Table QR Pass
              </span>
              <h3 className="text-2xl font-black text-slate-900 mt-2">Table {qrModalTable.tableNumber}</h3>
              <p className="text-xs text-slate-400 font-semibold">{qrModalTable.room || "Main Room"}</p>
            </div>

            {/* Printable QR Token Card */}
            <div id="printable-table-qr" className="border-2 border-slate-900 bg-white p-5 rounded-3xl shadow-sm inline-block mx-auto mb-5">
              <p className="text-[10px] font-black text-slate-900 tracking-widest uppercase mb-1">SORAS MENU</p>
              <div className="bg-white p-2 border border-slate-100 rounded-2xl inline-block overflow-hidden">
                <img
                  src={qrModalTable.qrCodeUrl}
                  alt={`Table ${qrModalTable.tableNumber} QR`}
                  className="w-48 h-48 object-contain"
                />
              </div>
              <div className="mt-2 border-t border-dashed border-slate-300 pt-2">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{qrModalTable.room || "Main Room"}</p>
                <p className="text-2xl font-black text-slate-900">TABLE {qrModalTable.tableNumber}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handlePrintQr}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-3 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Printer size={14} /> Print Card
              </button>
              <button
                type="button"
                disabled={downloadingTableId === qrModalTable._id}
                onClick={(e) => handleDownloadQr(e, qrModalTable)}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white text-xs font-bold py-3 rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/10"
              >
                {downloadingTableId === qrModalTable._id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Download size={14} />
                )}
                {downloadingTableId === qrModalTable._id ? "Saving..." : "Download PNG"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}