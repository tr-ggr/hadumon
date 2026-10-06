import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

import { AUTH_COOKIE_PREFIX, AUTH_ROUTES } from "~/lib/auth/constants";

/** Routes a signed-out visitor may see: the landing page and its OG image. */
const PUBLIC_ROUTES = ["/", "/opengraph-image"];
/**
 * Pages made to be shared, which a signed-out visitor may open too: a
 * player's profile and runs, and one run's record. Each page decides for
 * itself what such a visitor may see of it.
 */
const SHARED_PAGES = [
  /^\/players\/[^/]+(\/runs)?$/,
  /^\/runs\/[0-9a-f-]{36}$/i,
];

/**
 * Cheap cookie-presence gate: keeps visitors with no session cookie off app
 * routes. It cannot tell a live session from a stale cookie, so it never
 * redirects away from the auth pages; those check the real session themselves.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(
    getSessionCookie(request, { cookiePrefix: AUTH_COOKIE_PREFIX }),
  );
  const isAuthRoute = AUTH_ROUTES.includes(pathname);
  const isPublicRoute =
    PUBLIC_ROUTES.includes(pathname) ||
    SHARED_PAGES.some((page) => page.test(pathname));

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
