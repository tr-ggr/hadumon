import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentUser } from "~/server/auth/session";
import { api, HydrateClient } from "~/trpc/server";
import { RunView } from "./RunView";

export const metadata: Metadata = { title: "Play — HaduMon" };

export default async function RunPage() {
  // The middleware only checks that a cookie exists; this checks it is valid.
  if (!(await getCurrentUser())) redirect("/");

  await api.run.current.prefetch();

  return (
    <HydrateClient>
      <RunView />
    </HydrateClient>
  );
}
