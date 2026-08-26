"use client";
import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, XCircle, Clock, IndianRupee, Building2, Loader2, LogOut, RefreshCw, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/utils/fetchWithAuth";

const STATUS_STYLES = {
  pending:  { badge: "bg-amber-100 text-amber-700 border-amber-200",  dot: "bg-amber-500" },
  approved: { badge: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  rejected: { badge: "bg-rose-100 text-rose-700 border-rose-200",   dot: "bg-rose-500" },
};

export default function SuperAdminPanel() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [rejectionModal, setRejectionModal] = useState(null); // { paymentId }
  const [rejectionReason, setRejectionReason] = useState("");
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  // ── Auth check ────────────────────────────────────────────────────────────
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetchWithAuth("/api/user/me");
        const data = await res.json();
        if (!res.ok || data?.data?.role !== "admin") {
          router.replace("/auth");
          return;
        }
        setCurrentUser(data.data);
      } catch {
        router.replace("/auth");
      }
    }
    checkAuth();
  }, [router]);

  // ── Fetch all payments ────────────────────────────────────────────────────
  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth("/api/payment/getPaymentStatus");
      const data = await res.json();
      if (data.success) setPayments(data.data || []);
    } catch (err) {
      console.error("Error fetching payments:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: "", message: "" }), 4000);
  };

  // ── Approve ───────────────────────────────────────────────────────────────
  const handleApprove = async (paymentId) => {
    setActionLoading(p => ({ ...p, [paymentId]: "approving" }));
    try {
      const res = await fetchWithAuth("/api/payment/verifyPayment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, status: "approved" }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback("success", "✅ Payment approved — restaurant account activated!");
        fetchPayments();
      } else {
        showFeedback("error", data.message || "Approval failed");
      }
    } catch {
      showFeedback("error", "Network error");
    } finally {
      setActionLoading(p => ({ ...p, [paymentId]: null }));
    }
  };

  // ── Reject ────────────────────────────────────────────────────────────────
  const handleReject = async () => {
    if (!rejectionReason.trim()) return;
    const { paymentId } = rejectionModal;
    setActionLoading(p => ({ ...p, [paymentId]: "rejecting" }));
    setRejectionModal(null);
    try {
      const res = await fetchWithAuth("/api/payment/verifyPayment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, status: "rejected", rejectionReason }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback("success", "Payment rejected and restaurant notified.");
        fetchPayments();
      } else {
        showFeedback("error", data.message || "Rejection failed");
      }
    } catch {
      showFeedback("error", "Network error");
    } finally {
      setActionLoading(p => ({ ...p, [paymentId]: null }));
      setRejectionReason("");
    }
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await fetchWithAuth("/api/auth/logout", { method: "POST" });
    router.push("/auth");
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const pending  = payments.filter(p => p.status === "pending");
  const approved = payments.filter(p => p.status === "approved");
  const rejected = payments.filter(p => p.status === "rejected");

  return (
    <div className="min-h-screen bg-[#0F0E1A] text-white font-sans">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="border-b border-white/10 bg-[#1A1830]/80 backdrop-blur-md sticky top-0 z-20 px-4 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-black tracking-wider text-white">SORAS <span className="text-purple-400">ADMIN</span></h1>
          <p className="text-[11px] text-slate-400 mt-0.5">Platform Control Centre</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">{currentUser?.email}</span>
          <button onClick={fetchPayments} className="text-slate-400 hover:text-white transition">
            <RefreshCw size={15} />
          </button>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-rose-400 transition">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* ── Stat Cards ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {[
            { label: "Pending Review", count: pending.length, color: "text-amber-400", bg: "border-amber-500/20 bg-amber-500/5" },
            { label: "Approved", count: approved.length, color: "text-emerald-400", bg: "border-emerald-500/20 bg-emerald-500/5" },
            { label: "Rejected", count: rejected.length, color: "text-rose-400", bg: "border-rose-500/20 bg-rose-500/5" },
          ].map(({ label, count, color, bg }) => (
            <div key={label} className={`rounded-2xl border p-5 ${bg}`}>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
              <p className={`text-4xl font-black mt-1 ${color}`}>{count}</p>
            </div>
          ))}
        </div>

        {/* ── Feedback Banner ──────────────────────────────────────────── */}
        {feedback.message && (
          <div className={`mb-6 p-4 rounded-2xl text-sm font-semibold text-center ${feedback.type === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}`}>
            {feedback.message}
          </div>
        )}

        {/* ── Payment List ─────────────────────────────────────────────── */}
        <div className="space-y-4">
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">
            All Subscription Payments ({payments.length})
          </h2>

          {loading ? (
            <div className="flex items-center justify-center h-40 text-slate-500">
              <Loader2 size={24} className="animate-spin mr-2" /> Loading payments...
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center text-slate-500 py-16">
              <IndianRupee size={36} className="mx-auto mb-3 opacity-30" />
              <p className="font-bold">No payments submitted yet.</p>
            </div>
          ) : (
            payments.map(payment => {
              const style = STATUS_STYLES[payment.status] || STATUS_STYLES.pending;
              const isActing = actionLoading[payment._id];
              const isPending = payment.status === "pending";

              return (
                <div key={payment._id} className="bg-[#1A1830] border border-white/8 rounded-2xl p-5 hover:border-white/15 transition">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">

                    {/* Left: Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-full border ${style.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                          {payment.status.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">#{payment._id?.slice(-8)}</span>
                      </div>

                      <div className="flex items-center gap-2 mb-1">
                        <Building2 size={13} className="text-purple-400 flex-shrink-0" />
                        <p className="text-sm font-bold text-white truncate">
                          {payment.restaurantId?.name || "Unknown Restaurant"}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-1">
                        <span className="font-mono text-slate-500">Manager: {payment.managerId?.email || payment.managerId?.fullName || "—"}</span>
                        <span className="flex items-center gap-1">
                          <Clock size={11} /> {new Date(payment.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                        {payment.note && <span className="italic">"{payment.note}"</span>}
                      </div>

                      {payment.rejectionReason && (
                        <p className="text-xs text-rose-400 mt-2 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20">
                          ❌ Rejected: {payment.rejectionReason}
                        </p>
                      )}
                    </div>

                    {/* Right: Screenshot + Actions */}
                    <div className="flex flex-row sm:flex-col items-start sm:items-end gap-3 flex-shrink-0 w-full sm:w-auto">
                      {payment.screenshotUrl && (
                        <a href={payment.screenshotUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[11px] font-bold text-purple-400 hover:text-purple-300 transition border border-purple-500/30 px-3 py-1.5 rounded-lg bg-purple-500/5 hover:bg-purple-500/10">
                          <ExternalLink size={11} /> View Screenshot
                        </a>
                      )}

                      {isPending && (
                        <div className="flex gap-2">
                          <button
                            disabled={!!isActing}
                            onClick={() => handleApprove(payment._id)}
                            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
                          >
                            {isActing === "approving" ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                            Approve
                          </button>
                          <button
                            disabled={!!isActing}
                            onClick={() => { setRejectionModal({ paymentId: payment._id }); setRejectionReason(""); }}
                            className="flex items-center gap-1.5 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-400 text-xs font-bold px-4 py-2 rounded-xl transition"
                          >
                            {isActing === "rejecting" ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Rejection Modal ───────────────────────────────────────────────── */}
      {rejectionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#1A1830] border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-base font-black text-white mb-1">Reject Payment</h3>
            <p className="text-xs text-slate-400 mb-4">Provide a clear reason — this will be visible to the restaurant manager.</p>
            <textarea
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="e.g. Payment amount mismatch, wrong UPI reference..."
              rows={3}
              className="w-full bg-[#0F0E1A] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-rose-500/50 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setRejectionModal(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition">
                Cancel
              </button>
              <button onClick={handleReject} disabled={!rejectionReason.trim()}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 disabled:bg-slate-700 disabled:text-slate-500 text-white transition">
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
