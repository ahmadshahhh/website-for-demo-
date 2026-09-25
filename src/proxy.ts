import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic redirects only — real authentication and authorisation happen
 * in every page, Server Action and route handler (see lib/auth/guards.ts).
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/admin") && pathname !== "/admin/login" && !req.cookies.has("sy_admin")) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }
  if (pathname.startsWith("/account") && !req.cookies.has("sy_session")) {
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(pathname)}`, req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/account/:path*"] };
