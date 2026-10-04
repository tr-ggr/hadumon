import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentUser } from "~/server/auth/session";
import { api, HydrateClient } from "~/trpc/server";
import { CodexView } from "./CodexView";

export const metadata: Metadata = { title: "Codex — HaduMon" };

export default async function CodexPage() {
  // The middleware only checks that a cookie exists; this checks it is valid.
  if (!(await getCurrentUser())) redirect("/");

  await api.codex.get.prefetch();

  return (
    <HydrateClient>
      <CodexView />
    </HydrateClient>
  );
}
