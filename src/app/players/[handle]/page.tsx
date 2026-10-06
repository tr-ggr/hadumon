import type { Metadata } from "next";

import { PlayerProfileView } from "~/components/players/PlayerProfileView";
import { VisitorFrame } from "~/components/players/VisitorFrame";
import { getCurrentUser } from "~/server/auth/session";
import { api, HydrateClient } from "~/trpc/server";

interface Params {
  params: Promise<{ handle: string }>;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { handle } = await params;
  return { title: `${decodeURIComponent(handle)} — HaduMon` };
}

/** A player's profile. It is made to be shared: anyone may open it. */
export default async function PlayerPage({ params }: Params) {
  const handle = decodeURIComponent((await params).handle).toLowerCase();
  const user = await getCurrentUser();

  await api.players.profile.prefetch({ handle });

  return (
    <HydrateClient>
      <VisitorFrame signedIn={user !== null}>
        <PlayerProfileView handle={handle} />
      </VisitorFrame>
    </HydrateClient>
  );
}
