"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";

import { DEFAULT_LOOK, type Look } from "~/server/game/cosmetics";
import { api } from "~/trpc/react";

import { SKIN_VARS, skinVars } from "./skins";

const LookContext = createContext<Look>(DEFAULT_LOOK);

/** What the player wears, and what their table and tower are dressed in. */
export function useLook(): Look {
  return useContext(LookContext);
}

/**
 * Carries the look to everything drawn in it. The server paints the first
 * frame in the look it read for the request (`layout.tsx` sets the same
 * properties on the body), so nothing flashes; from then on the profile
 * query is the truth, and putting a piece on repaints the page at once.
 */
export function SkinProvider({
  initial,
  signedIn,
  children,
}: {
  /** The look the server rendered with. */
  initial: Look;
  signedIn: boolean;
  children: ReactNode;
}) {
  const profile = api.profile.get.useQuery(undefined, {
    enabled: signedIn,
    retry: false,
  });
  const look = profile.data?.look ?? initial;
  const { mat, cloth, tower } = look;

  // Dialogs are drawn on the body, outside this tree: the body is dressed.
  useEffect(() => {
    const vars = skinVars({ mat, cloth, tower });
    for (const name of SKIN_VARS) {
      const value = vars[name];
      if (value === undefined) document.body.style.removeProperty(name);
      else document.body.style.setProperty(name, value);
    }
  }, [mat, cloth, tower]);

  return <LookContext.Provider value={look}>{children}</LookContext.Provider>;
}
