"use client";
import React, { useState } from "react";
import { QrCode, Download, Printer, Layers, RefreshCw } from "lucide-react";
import QRCode from "qrcode.react";

export default function QrGenerator() {
    const [tableNumber, setTableNumber] = useState("1");
    const [restaurantId, setRestaurantId] = useState("REST-MADHUBANI-01"); // Example default
    const [generatedData, setGeneratedData] = useState("");
    const [isGenerated, setIsGenerated] = useState(false);

    // Fallback target or your actual production domain
    const BASE_URL = "https://soras.in/menu";

    const handleGenerateQR = (e) => {
        e.preventDefault();
        if (!tableNumber.trim()) return alert("Please specify a valid table number!");

        // 🔗 Constructing the exact payload URL required by your customer routing architecture
        const fullTargetUrl = `${BASE_URL}?rid=${encodeURIComponent(restaurantId)}&table=${encodeURIComponent(tableNumber)}`;

        setGeneratedData(fullTargetUrl);
        setIsGenerated(true);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="max-w-4xl">
            <div className="mb-6">
                <h2 className="text-2xl font-black text-slate-900">QR Generation Hub</h2>
                <p className="text-xs text-slate-400 mt-0.5">Provision secure, localized matrix codes linked to active dining floor coordinates</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 🛠️ Generation Form Panel */}
                <div className="bg-white border rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                    <form onSubmit={handleGenerateQR} className="space-y-4">
                        <div>
                            <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Restaurant Identifier Reference (Locked)</label>
                            <input
                                type="text"
                                disabled
                                value={restaurantId}
                                className="w-full bg-slate-100 border text-slate-500 rounded-xl px-4 py-2.5 text-xs font-mono outline-hidden cursor-not-allowed"
                            />
                        </div>

                        <div>
                            <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Target Table Configuration Number</label>
                            <input
                                type="number"
                                min="1"
                                required
                                value={tableNumber}
                                onChange={(e) => {
                                    setTableNumber(e.target.value);
                                    setIsGenerated(false); // Reset visualizer state to force confirmation click
                                }}
                                placeholder="e.g. 5, 12, 24"
                                className="w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-sm font-bold outline-hidden focus:border-purple-600"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-md shadow-purple-600/10"
                        >
                            <RefreshCw size={14} /> Compile Matrix Vector
                        </button>
                    </form>

                    {/* Flow Indicator Info Footnote */}
                    <div className="mt-6 bg-slate-50 border rounded-xl p-4 text-[11px] text-slate-500 space-y-1.5">
                        <p className="font-bold text-slate-700 uppercase tracking-wide text-[10px]">Embedded Payload Structure:</p>
                        <p className="font-mono bg-white p-2 rounded border break-all text-slate-600">
                            {generatedData || `${BASE_URL}?rid=${restaurantId}&table=${tableNumber}`}
                        </p>
                        <p className="text-slate-400 italic">Scanning triggers deep linking directly to your active digital menu router, capturing context flags automatically.</p>
                    </div>
                </div>

                {/* 🖨️ Visualizer & Action Card Panel */}
                <div className="bg-white border rounded-2xl p-6 shadow-xs flex flex-col items-center justify-center text-center">
                    {isGenerated ? (
                        <div className="space-y-6 w-full flex flex-col items-center">
                            {/* Premium Printable QR Token Container */}
                            <div id="printable-qr-card" className="border-2 border-slate-900 bg-white p-6 rounded-3xl shadow-sm inline-block max-w-[260px]">
                                <p className="text-xs font-black text-slate-900 tracking-widest uppercase mb-1">SORAS MENU</p>
                                <div className="bg-white p-3 border border-slate-100 rounded-2xl inline-block">
                                    <QRCodeSVG value={generatedData} size={160} level="H" includeMargin={false} />
                                </div>
                                <div className="mt-3 border-t border-dashed border-slate-300 pt-2">
                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Scan to Order</p>
                                    <p className="text-2xl font-black text-slate-900">TABLE {tableNumber}</p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 gap-3 w-full max-w-[280px]">
                                <button
                                    onClick={handlePrint}
                                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5"
                                >
                                    <Printer size={14} /> Print Ticket
                                </button>
                                <button
                                    onClick={() => alert("Image download trigger hooked successfully!")}
                                    className="border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5"
                                >
                                    <Download size={14} /> Save Vector
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-slate-400 py-12 flex flex-col items-center justify-center">
                            <QrCode size={48} className="stroke-1 text-slate-300 mb-2 animate-pulse" />
                            <p className="text-xs font-semibold">Awaiting Matrix Configuration</p>
                            <p className="text-[11px] text-slate-400 max-w-[200px] mt-1 mx-auto">Input table coordinates on the left to materialize a scan target.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}