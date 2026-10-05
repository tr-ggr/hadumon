import "server-only";

import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { after } from "next/server";

import { env } from "~/env";
import { AUTH_COOKIE_PREFIX, DEMO_EMAIL } from "~/lib/auth/constants";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  usernameSchema,
} from "~/lib/auth/validation";
import { db } from "~/server/db";
import {
  accounts,
  rateLimits,
  sessions,
  users,
  verifications,
} from "~/server/db/schema/auth";
import { sendResetEmail } from "./email";
import { hashPassword, verifyPassword } from "./password";
import { RESET_LINK_TTL_SECONDS } from "./reset-email";

const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

/** Sign-in, sign-up and the two reset steps: a handful a minute per address. */
const STRICT_LIMIT = { window: 60, max: 5 };

/**
 * Where the app is served from. One fixed origin when `BETTER_AUTH_URL` is
 * set. Otherwise it is read from each request and held to a list: on Vercel
 * the exact hosts of this deployment, locally the loopback ones.
 *
 * The Vercel list is deliberately not `*.vercel.app`. A reset link is built
 * on this origin, and that wildcard would let a request name anyone's Vercel
 * site as the place the link leads.
 */
function baseURL() {
  if (env.BETTER_AUTH_URL) return env.BETTER_AUTH_URL;

  const vercelHosts = [
    env.VERCEL_PROJECT_PRODUCTION_URL,
    env.VERCEL_BRANCH_URL,
    env.VERCEL_URL,
  ].filter((host): host is string => Boolean(host));

  const [primary] = vercelHosts;
  if (primary) {
    return {
      allowedHosts: [...new Set(vercelHosts)],
      protocol: "https" as const,
      fallback: `https://${primary}`,
    };
  }

  return {
    allowedHosts: ["localhost:*", "127.0.0.1:*"],
    protocol: "http" as const,
    fallback: `http://localhost:${process.env.PORT ?? 3000}`,
  };
}

/** `name` is the username: the same rules whoever writes it. */
function assertUsername(name: unknown): void {
  const parsed = usernameSchema.safeParse(name);
  if (parsed.success) return;
  throw new APIError("BAD_REQUEST", {
    code: "INVALID_USERNAME",
    message: parsed.error.issues[0]?.message ?? "Invalid username",
  });
}

export const auth = betterAuth({
  appName: "HaduMon",
  baseURL: baseURL(),
  secret: env.BETTER_AUTH_SECRET,

  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications,
      rateLimit: rateLimits,
    },
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: PASSWORD_MIN_LENGTH,
    maxPasswordLength: PASSWORD_MAX_LENGTH,
    password: {
      hash: hashPassword,
      verify: ({ hash, password }) => verifyPassword(password, hash),
    },
    resetPasswordTokenExpiresIn: RESET_LINK_TTL_SECONDS,
    revokeSessionsOnPasswordReset: true,
    // Resolves at once and sends after the response has gone: a known email
    // then answers no slower than an unknown one, and `after` keeps the
    // function alive for the send, which a bare un-awaited promise does not.
    sendResetPassword: async ({ user, url }) => {
      // Anyone can sign in to the demo account, so nobody may reset it.
      if (user.email === DEMO_EMAIL) return;
      after(() => sendResetEmail({ to: user.email, name: user.name, url }));
    },
  },

  session: { expiresIn: SESSION_TTL_SECONDS },

  // A reset token is as good as a password for an hour, so only its hash is
  // kept: reading the table does not hand anyone a working link.
  verification: { storeIdentifier: "hashed" },

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          assertUsername(user.name);
        },
      },
      update: {
        before: async (user) => {
          if (user.name !== undefined) assertUsername(user.name);
        },
      },
    },
  },

  // Nothing in the app edits an account once it exists. Leaving these open
  // would let any visitor change the public demo account's password or
  // email, or delete it. The list is matched exactly, path by path.
  disabledPaths: [
    "/update-user",
    "/change-password",
    "/change-email",
    "/delete-user",
    "/delete-user/callback",
    "/revoke-session",
    "/revoke-sessions",
    "/revoke-other-sessions",
  ],

  // On in production only, which is Better Auth's default.
  rateLimit: {
    // In the database: memory would be counted per server instance.
    storage: "database",
    customRules: {
      "/sign-in/email": STRICT_LIMIT,
      "/sign-up/email": STRICT_LIMIT,
      "/request-password-reset": STRICT_LIMIT,
      "/reset-password": STRICT_LIMIT,
    },
  },

  advanced: {
    cookiePrefix: AUTH_COOKIE_PREFIX,
    database: { generateId: "uuid" },
    ipAddress: {
      // Vercel sets its own header to the one client address; the standard
      // header is trusted only when it holds a single address.
      ipAddressHeaders: ["x-vercel-forwarded-for", "x-forwarded-for"],
    },
  },

  // Must stay last: it writes the cookies of a server-side `auth.api` call.
  plugins: [nextCookies()],
});
