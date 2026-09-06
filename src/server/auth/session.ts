import "server-only";

import { randomBytes } from "node:crypto";
import { and, eq, gt, lt } from "drizzle-orm";
import { cookies } from "next/headers";

import { db } from "~/server/db";
import { sessions, users, type User } from "~/server/db/schema/auth";

export const SESSION_COOKIE = "hadumon_session";
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/** The trainer record minus anything secret. */
export type SessionUser = Omit<User, "passwordHash">;

const PUBLIC_USER_COLUMNS = {
  id: users.id,
  username: users.username,
  displayName: users.displayName,
  gold: users.gold,
  gems: users.gems,
  rating: users.rating,
  isBot: users.isBot,
  createdAt: users.createdAt,
} as const;

/** Creates a session row and sets the cookie. Returns the opaque token. */
export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await db.insert(sessions).values({ id: token, userId, expiresAt });
  // Opportunistic cleanup so the table does not grow without bound.
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
  await setSessionCookie(token, expiresAt);

  return token;
}

/** Looks up a non-expired session and returns its trainer, or null. */
export async function validateSession(
  token: string | undefined | null,
): Promise<SessionUser | null> {
  if (!token) return null;

  const [row] = await db
    .select(PUBLIC_USER_COLUMNS)
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, token), gt(sessions.expiresAt, new Date())))
    .limit(1);

  return row ?? null;
}

/** Deletes the session row and clears the cookie. */
export async function deleteSession(
  token: string | undefined | null,
): Promise<void> {
  if (token) {
    await db.delete(sessions).where(eq(sessions.id, token));
  }
  await clearSessionCookie();
}

/** Reads the session token from the request cookies. */
export async function getSessionToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value;
}

/** Resolves the signed-in trainer for the current request, if any. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  return validateSession(await getSessionToken());
}

async function setSessionCookie(token: string, expiresAt: Date): Promise<void> {
  const store = await cookies();
  // Cookie writes are only legal in route handlers / server actions; reading a
  // session inside an RSC render must never crash the page.
  try {
    store.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      expires: expiresAt,
    });
  } catch {
    /* not in a mutable cookie context — the caller already has the token */
  }
}

async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  try {
    store.set(SESSION_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 0,
    });
  } catch {
    /* not in a mutable cookie context */
  }
}
