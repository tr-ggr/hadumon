import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "hadumon_session";
const AUTH_ROUTES = ["/login", "/signup"];
/** Routes a signed-out visitor may see: the landing page and its OG image. */
const PUBLIC_ROUTES = ["/", "/opengraph-image"];

/**
 * Cheap cookie-presence gate. Real session validation happens in tRPC
 * (`protectedProcedure`); this only keeps signed-out visitors off app routes
 * and signed-in trainers off the auth pages.
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

  if (hasSession && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
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
