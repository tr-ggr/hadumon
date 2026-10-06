import type { Metadata } from "next";

import { PlayerRunsView } from "~/components/runs/RunHistory";
import { VisitorFrame } from "~/components/players/VisitorFrame";
import { getCurrentUser } from "~/server/auth/session";

interface Params {
  params: Promise<{ handle: string }>;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { handle } = await params;
  return { title: `${decodeURIComponent(handle)}'s runs — HaduMon` };
}

/** Every run a player shows, newest first. */
export default async function PlayerRunsPage({ params }: Params) {
  const handle = decodeURIComponent((await params).handle).toLowerCase();
  const user = await getCurrentUser();

  return (
    <VisitorFrame signedIn={user !== null}>
      <PlayerRunsView handle={handle} />
    </VisitorFrame>
  );
}
