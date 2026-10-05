import "server-only";

import { headers } from "next/headers";
import { cache } from "react";

import { auth } from "~/server/auth";

/** The signed-in player, as the rest of the app knows them. */
export interface SessionUser {
  id: string;
  email: string;
  /** The username typed at signup. Shown, never used to sign in. */
  displayName: string;
  createdAt: Date;
}

/**
 * Resolves the signed-in player for the current request, if any.
 *
 * Wrapped in React `cache()` so the layout, the page and the tRPC context
 * share one lookup per request instead of hitting the sessions table each.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const { id, email, name, createdAt } = session.user;
  return { id, email, displayName: name, createdAt };
});
