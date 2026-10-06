import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PlayersView } from "~/components/players/PlayersView";
import { getCurrentUser } from "~/server/auth/session";

export const metadata: Metadata = { title: "Players — HaduMon" };

export default async function PlayersPage() {
  // The middleware only checks that a cookie exists; this checks it is valid.
  if (!(await getCurrentUser())) redirect("/");

  return <PlayersView />;
}
