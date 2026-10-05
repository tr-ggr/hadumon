import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { DeckBuilder } from "~/components/deck/DeckBuilder";
import { getCurrentUser } from "~/server/auth/session";
import { api, HydrateClient } from "~/trpc/server";

export const metadata: Metadata = { title: "Deck — HaduMon" };

export default async function DeckPage() {
  // The middleware only checks that a cookie exists; this checks it is valid.
  if (!(await getCurrentUser())) redirect("/");

  await Promise.all([
    api.collection.get.prefetch(),
    api.collection.deck.prefetch(),
  ]);

  return (
    <HydrateClient>
      <DeckBuilder />
    </HydrateClient>
  );
}
