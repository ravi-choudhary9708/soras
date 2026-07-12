"use client";
import React, { useState } from "react";
import { QrCode, Download, Printer, RefreshCw, Layers } from "lucide-react";

export default function QrGenerator() {
  const [tableNumber, setTableNumber] = useState("");
  const [room, setRoom] = useState("Main Hall"); // Matches the 'room' input your backend expects
  const [qrImage, setQrImage] = useState(""); // Stores the incoming base64ImageString from database
  const [isLoading, setIsLoading] = useState(false);
  const [generatedTableData, setGeneratedTableData] = useState(null);

  const handleGenerateQR = async (e) => {
    e.preventDefault();
    if (!tableNumber.trim()) return alert("Please specify a valid table number!");

    setIsLoading(true);
    try {
      // 📡 Dispatched payload matching your backend: { tableNumber, room }
      const response = await fetch("/api/manager/table/generateQr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          tableNumber: tableNumber,
          room: room,
        }),
      });

      const data = await response.json();

      console.log("data:", data);

      if (!response.ok) {
        throw new Error(data.message || "Failed to compile QR vector backend-side.");
      }

      // Your backend returns the provisionedTable object inside an apiResponse structure
      // Extrapolating the generated base64 image string and document specs:
      const tableData = data.data;
      setQrImage(tableData.qrCodeUrl); // Holds 'base64ImageString'
      setGeneratedTableData(tableData);
    } catch (error) {
      console.error("Connection error:", error);
      alert(` Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-900">QR Generation Hub</h2>
        <p className="text-xs text-slate-400 mt-0.5">Provision secure database-synced matrix codes linking physical tables to cloud routes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 🛠️ LEFT: Generation Controller */}
        <div className="bg-white border rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <form onSubmit={handleGenerateQR} className="space-y-4">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Target Table Configuration Number</label>
              <input
                type="number"
                min="1"
                required
                value={tableNumber}
                onChange={(e) => {
                  setTableNumber(e.target.value);
                  setQrImage(""); // Reset visualizer on change
                }}
                placeholder="e.g. 5, 12"
                className="w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-sm font-bold outline-hidden focus:border-purple-600"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Room / Floor Section Designation</label>
              <select
                value={room}
                onChange={(e) => {
                  setRoom(e.target.value);
                  setQrImage("");
                }}
                className="w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-sm font-bold outline-hidden focus:border-purple-600"
              >
                <option>Main Hall</option>
                <option>Rooftop Seating</option>
                <option>VIP Cabin</option>
                <option>Garden Area</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-md shadow-purple-600/10"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
              {isLoading ? "Compiling Database Records..." : "Compile Matrix Vector"}
            </button>
          </form>

          {/* Current Status Mapping Meta Info Box */}
          {generatedTableData && (
            <div className="mt-6 bg-slate-50 border rounded-xl p-4 text-[11px] text-slate-500 space-y-1">
              <p className="font-bold text-slate-700 uppercase tracking-wide text-[10px]">Database Metadata Status:</p>
              <p><span className="font-semibold text-slate-600">Table Signature ID:</span> <span className="font-mono text-slate-500">{generatedTableData.masterQrCode}</span></p>
              <p><span className="font-semibold text-slate-600">Initial State Assignment:</span> <span className="text-emerald-600 font-bold uppercase text-[9px] bg-emerald-100 px-1.5 py-0.5 rounded">{generatedTableData.status}</span></p>
            </div>
          )}
        </div>

        {/* 🖨️ RIGHT: Live Production Preview Render */}
        <div className="bg-white border rounded-2xl p-6 shadow-xs flex flex-col items-center justify-center text-center">
          {qrImage ? (
            <div className="space-y-6 w-full flex flex-col items-center">
              {/* Premium Printable Token Card Generated directly from Backend base64 */}
              <div id="printable-qr-card" className="border-2 border-slate-900 bg-white p-6 rounded-3xl shadow-sm inline-block max-w-[260px]">
                <p className="text-xs font-black text-slate-900 tracking-widest uppercase mb-1">SORAS MENU</p>

                <div className="bg-white p-2 border border-slate-100 rounded-2xl inline-block overflow-hidden">
                  {/* Directly injected Base64 Image string from node backend */}
                  <img src={qrImage} alt="Soras Database QR Token" className="w-44 h-44 object-contain" />
                </div>

                <div className="mt-3 border-t border-dashed border-slate-300 pt-2">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{room}</p>
                  <p className="text-2xl font-black text-slate-900">TABLE {tableNumber}</p>
                </div>
              </div>

              {/* Action Rows */}
              <div className="grid grid-cols-2 gap-3 w-full max-w-[280px]">
                <button
                  onClick={handlePrint}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  <Printer size={14} /> Print Ticket
                </button>
                <a
                  href={qrImage}
                  download={`Soras_Table_${tableNumber}.png`}
                  className="border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 text-center"
                >
                  Save Image
                </a>
              </div>
            </div>
          ) : (
            <div className="text-slate-400 py-12 flex flex-col items-center justify-center">
              <QrCode size={48} className={`stroke-1 text-slate-300 mb-2 ${isLoading ? "animate-spin text-purple-400" : ""}`} />
              <p className="text-xs font-semibold">{isLoading ? "Processing Security Crypt..." : "Awaiting Matrix Configuration"}</p>
              <p className="text-[11px] text-slate-400 max-w-[200px] mt-1 mx-auto text-center">
                {isLoading ? "Syncing changes into cloud document architecture..." : "Input parameters on the left to request an immutable storefront entry."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}