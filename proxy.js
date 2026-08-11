import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

// ── Route Protection Map ────────────────────────────────────────────────────
const PROTECTED_ROUTES = [
  { prefix: "/admin/super",     roles: ["admin"] },
  { prefix: "/admin/dashboard", roles: ["manager"] },
  { prefix: "/dashboard",       roles: ["staff", "chef", "manager"] },
];

// Role → home redirect mapping
const ROLE_HOME = {
  admin:   "/admin/super",
  manager: "/admin/dashboard",
  staff:   "/dashboard",
  chef:    "/dashboard",
};

function getSecret() {
  return new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRET);
}

async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload; // { _id, role, restaurantId, email, ... }
  } catch {
    return null;
  }
}

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  // Find if this path needs protection
  const match = PROTECTED_ROUTES.find(r => pathname.startsWith(r.prefix));

  // Not a protected route — let it through
  if (!match) return NextResponse.next();

  // Read the httpOnly access token cookie
  const token = request.cookies.get("accessToken")?.value;

  if (!token) {
    // No token — redirect to login with original destination preserved
    const loginUrl = new URL("/auth", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify JWT (jose is Edge-compatible, unlike jsonwebtoken)
  const payload = await verifyToken(token);

  if (!payload) {
    // Token expired or tampered — redirect to login
    const loginUrl = new URL("/auth", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check role is allowed for this route
  if (!match.roles.includes(payload.role)) {
    // Authenticated but wrong role — send them to their correct home
    const home = ROLE_HOME[payload.role] || "/auth";
    return NextResponse.redirect(new URL(home, request.url));
  }

  // ✅ Authorized — pass through, attach user info to headers for downstream use
  const response = NextResponse.next();
  response.headers.set("x-user-role", payload.role);
  response.headers.set("x-user-id", payload._id?.toString() ?? "");
  return response;
}

// ── Matcher — only page routes, skip API / static / images ─────────────────
export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
  ],
};