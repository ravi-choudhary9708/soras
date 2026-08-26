"use client";
import React from "react";
import Link from "next/link";
import { ArrowRight, QrCode, ChefHat, LayoutDashboard, ShieldCheck, Zap, UtensilsCrossed, ChevronRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-600 font-sans selection:bg-orange-500/30 selection:text-orange-900 overflow-x-hidden">
      {/* ── Navbar ───────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 h-20 bg-white/90 backdrop-blur-md border-b border-slate-100 z-50">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/20">
              <UtensilsCrossed size={20} className="text-white" />
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tight">soras</span>
          </div>
          <div className="flex items-center gap-8">
            <Link href="#features" className="text-sm font-bold text-slate-600 hover:text-red-500 transition hidden md:block">Features</Link>
            <Link href="#how-it-works" className="text-sm font-bold text-slate-600 hover:text-red-500 transition hidden md:block">How it Works</Link>
            <Link href="/auth" className="text-sm font-bold text-slate-900 hover:text-red-600 transition hidden sm:block">
              Login
            </Link>
            <Link href="/auth" className="text-sm font-bold bg-black text-white px-6 py-3 rounded-2xl hover:bg-slate-800 transition shadow-md">
              Partner with us
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 px-6 overflow-hidden">
        {/* Soft background shape */}
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[600px] h-[600px] bg-gradient-to-br from-orange-100 to-red-50 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[400px] h-[400px] bg-gradient-to-tr from-rose-100 to-transparent rounded-full blur-3xl -z-10" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          
          <h1 className="text-3xl sm:text-5xl md:text-[80px] font-black text-slate-900 tracking-tighter leading-[1.05] mb-6 sm:mb-8">
            The ultimate OS for <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
              modern restaurants.
            </span>
          </h1>
          
          <p className="text-base sm:text-lg md:text-2xl text-slate-500 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
            SORAS transforms your dine-in experience. Instant QR ordering, real-time kitchen syncing, and smart floor management — all in one place.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth" className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold transition flex items-center justify-center gap-2 shadow-xl shadow-red-500/25 text-lg group">
              Start your free trial 
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="#features" className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-bold transition flex items-center justify-center text-lg">
              Explore features
            </Link>
          </div>
          
          <div className="mt-8 sm:mt-12 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm font-bold text-slate-400">
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /> No app required</div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Setup in 10 mins</div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Free 14-day trial</div>
          </div>
        </div>
      </section>

      {/* ── Features Grid ────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">Everything you need to grow</h2>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">Manage your floor, delight your guests, and keep your kitchen running perfectly in sync.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-[2rem] bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(239,68,68,0.1)] transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <QrCode className="text-red-500" size={28} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-3">Instant QR Ordering</h3>
              <p className="text-slate-500 leading-relaxed text-lg">
                Guests scan a table QR code and order instantly from their browser. No app downloads, no waiting for waiters.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-[2rem] bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(249,115,22,0.1)] transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ChefHat className="text-orange-500" size={28} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-3">Live Kitchen Sync</h3>
              <p className="text-slate-500 leading-relaxed text-lg">
                Orders fire directly to the kitchen in real-time. Chefs can mark items as preparing or ready with a single tap.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-[2rem] bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(16,185,129,0.1)] transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <LayoutDashboard className="text-emerald-500" size={28} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-3">Smart Floor Plan</h3>
              <p className="text-slate-500 leading-relaxed text-lg">
                Get a bird's-eye view of your dining room. Track occupied tables, view live bills, and settle payments instantly.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 rounded-[2rem] bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(99,102,241,0.1)] transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck className="text-indigo-500" size={28} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-3">Role-Based Access</h3>
              <p className="text-slate-500 leading-relaxed text-lg">
                Custom dashboards for managers, staff, chefs, and admins. Everyone sees exactly what they need to do their job.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-8 rounded-[2rem] bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(236,72,153,0.1)] transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-pink-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="text-pink-500" size={28} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-3">Instant Menu Updates</h3>
              <p className="text-slate-500 leading-relaxed text-lg">
                Update prices, add photos, or toggle availability with one click. Changes reflect instantly on your customers' phones.
              </p>
            </div>

             {/* CTA Card */}
             <div className="p-8 rounded-[2rem] bg-gradient-to-br from-red-500 to-orange-500 shadow-xl shadow-red-500/20 flex flex-col items-start justify-center relative overflow-hidden group">
              <div className="absolute -bottom-10 -right-10 opacity-10">
                <UtensilsCrossed size={200} className="text-white" />
              </div>
              <h3 className="text-3xl font-black text-white mb-4 relative z-10">Ready to transform?</h3>
              <p className="text-red-100 mb-8 relative z-10 font-medium">Join hundreds of restaurants using SORAS today.</p>
              <Link href="/auth" className="px-6 py-4 rounded-2xl bg-white text-red-600 font-bold hover:bg-slate-50 transition shadow-lg flex items-center gap-2 relative z-10">
                Partner with us <ChevronRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="py-16 px-6 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
               <UtensilsCrossed size={14} className="text-white" />
             </div>
             <span className="text-xl font-black text-slate-900 tracking-tight">soras</span>
          </div>
          <p className="text-sm text-slate-500 font-medium">
            © {new Date().getFullYear()} SORAS Platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
