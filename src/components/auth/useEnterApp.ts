"use client";

import { useRouter } from "next/navigation";

import { api } from "~/trpc/react";

/**
 * Takes a visitor who has just signed in to a page of the app. Whatever was
 * fetched while signed out is thrown away first, and the server is asked
 * again so the shell is drawn around the page.
 */
export function useEnterApp(): (destination: string) => Promise<void> {
  const router = useRouter();
  const utils = api.useUtils();

  return async (destination) => {
    await utils.invalidate();
    router.push(destination);
    router.refresh();
  };
}
