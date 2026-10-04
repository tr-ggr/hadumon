import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "hadumon_session";
const AUTH_ROUTES = ["/login", "/signup"];
/** Routes a signed-out visitor may see: the landing page and its OG image. */
const PUBLIC_ROUTES = ["/", "/opengraph-image"];

/**
 * Cheap cookie-presence gate: keeps visitors with no session cookie off app
 * routes. It cannot tell a live session from a stale cookie, so it never
 * redirects away from the auth pages; those check the real session themselves.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  const isAuthRoute = AUTH_ROUTES.includes(pathname);
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  if (!hasSession && !isAuthRoute && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|webp|svg|ico)$).*)",
  ],
};
