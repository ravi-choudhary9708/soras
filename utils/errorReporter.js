/**
 * reportError — Sends client-side errors to /api/log/error
 *
 * Usage:
 *   import { reportError } from "@/utils/errorReporter";
 *   reportError(error, "MyComponent");
 */
export async function reportError(error, context = "unknown", extra = {}) {
  // Always log to console in dev
  if (process.env.NODE_ENV === "development") {
    console.error(`[SORAS Error] [${context}]`, error);
  }

  try {
    await fetch("/api/log/error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        message: error?.message || String(error),
        stack: error?.stack,
        url: typeof window !== "undefined" ? window.location.href : null,
        context,
        extra,
        severity: "error",
      }),
    });
  } catch {
    // Silently ignore — reporting errors can't cause more errors
  }
}
