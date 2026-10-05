/**
 * Auth facts shared by the server, the middleware and the browser. Nothing
 * here may import server code: the middleware runs on the edge.
 */

/** Better Auth names its cookies `<prefix>.session_token` and so on. */
export const AUTH_COOKIE_PREFIX = "hadumon";

/** Pages for a visitor who is signed out; they carry their own chrome. */
export const AUTH_ROUTES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
];

/** The public account behind "Use demo account". Its password is no secret. */
export const DEMO_EMAIL = "demo@hadumon.example";
export const DEMO_PASSWORD = "demo1234";
export const DEMO_NAME = "Demo";
