"use client";
import React from "react";
import { reportError } from "@/utils/errorReporter";

// ── Global unhandled error setup ──────────────────────────────────────────
// Runs once when this component mounts in the root layout
function setupGlobalHandlers() {
  if (typeof window === "undefined") return;

  // Catch unhandled promise rejections (e.g. failed fetchWithAuth calls)
  window.addEventListener("unhandledrejection", (event) => {
    const error = event.reason instanceof Error
      ? event.reason
      : new Error(String(event.reason));
    reportError(error, "unhandledRejection");
  });

  // Catch uncaught JS errors
  window.addEventListener("error", (event) => {
    if (event.error) {
      reportError(event.error, "windowError");
    }
  });
}

// ── React Error Boundary ──────────────────────────────────────────────────
// Class component — required for componentDidCatch
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
    // Set up global handlers once
    setupGlobalHandlers();
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error?.message || "Unknown error" };
  }

  componentDidCatch(error, errorInfo) {
    reportError(error, "ErrorBoundary", {
      componentStack: errorInfo?.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0F0E1A] flex items-center justify-center p-6">
          <div className="bg-[#1A1830] border border-red-500/20 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-5">
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
                <path stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>

            <h2 className="text-lg font-black text-white mb-2">Something went wrong</h2>
            <p className="text-sm text-slate-400 mb-1">
              An unexpected error occurred. Our team has been notified automatically.
            </p>
            {process.env.NODE_ENV === "development" && (
              <p className="text-xs text-red-400 bg-red-500/10 rounded-xl px-4 py-2 mt-3 font-mono text-left break-all">
                {this.state.errorMessage}
              </p>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => this.setState({ hasError: false, errorMessage: "" })}
                className="flex-1 py-3 rounded-xl text-sm font-bold border border-white/10 text-slate-300 hover:bg-white/5 transition"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = "/"}
                className="flex-1 py-3 rounded-xl text-sm font-bold bg-purple-600 hover:bg-purple-500 text-white transition"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
