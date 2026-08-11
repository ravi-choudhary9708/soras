/**
 * fetchWithAuth — Drop-in fetch() replacement with automatic token refresh.
 *
 * Flow:
 *   1. Make the request normally
 *   2. If response is 401 → call POST /api/auth/refresh (uses refreshToken cookie)
 *   3. If refresh succeeds → retry the original request once
 *   4. If refresh fails → redirect to /auth (session fully expired)
 *
 * Usage:
 *   import { fetchWithAuth } from "@/utils/fetchWithAuth";
 *   const res = await fetchWithAuth("/api/res/menu");
 *   const data = await res.json();
 */

let isRefreshing = false;
let pendingQueue = []; // Queued requests waiting for token refresh

function processQueue(error) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve();
  });
  pendingQueue = [];
}

export async function fetchWithAuth(url, options = {}) {
  // 1. Initial request
  const response = await fetch(url, { ...options, credentials: "include" });

  // 2. If not 401, return as-is
  if (response.status !== 401) return response;

  // 3. Got 401 — attempt token refresh
  // If another refresh is already in flight, queue this request
  if (isRefreshing) {
    await new Promise((resolve, reject) => {
      pendingQueue.push({ resolve, reject });
    });
    // Retry after refresh completes
    return fetch(url, { ...options, credentials: "include" });
  }

  isRefreshing = true;

  try {
    const refreshRes = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    });

    if (!refreshRes.ok) {
      // Refresh token also expired — full session end
      processQueue(new Error("Session expired"));
      isRefreshing = false;

      // Redirect to auth — preserve current page so user comes back after login
      if (typeof window !== "undefined") {
        const redirect = encodeURIComponent(window.location.pathname);
        window.location.href = `/auth?redirect=${redirect}`;
      }
      // Return a synthetic 401 so callers can handle gracefully
      return new Response(JSON.stringify({ success: false, message: "Session expired" }), { status: 401 });
    }

    // Refresh succeeded — new accessToken cookie is now set by the server
    processQueue(null);
    isRefreshing = false;

    // 4. Retry the original request with the new cookie
    return fetch(url, { ...options, credentials: "include" });

  } catch (err) {
    processQueue(err);
    isRefreshing = false;
    throw err;
  }
}
