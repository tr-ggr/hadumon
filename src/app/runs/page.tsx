import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { OwnRunsView } from "~/components/runs/RunHistory";
import { getCurrentUser } from "~/server/auth/session";

export const metadata: Metadata = { title: "Your runs — HaduMon" };

export default async function RunsPage() {
  // The middleware only checks that a cookie exists; this checks it is valid.
  if (!(await getCurrentUser())) redirect("/");

  return <OwnRunsView />;
}
