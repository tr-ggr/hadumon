import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentUser } from "~/server/auth/session";
import { api, HydrateClient } from "~/trpc/server";
import { ProfileView } from "./ProfileView";

export const metadata: Metadata = { title: "Profile — HaduMon" };

export default async function ProfilePage() {
  // The middleware only checks that a cookie exists; this checks it is valid.
  if (!(await getCurrentUser())) redirect("/");

  await api.profile.get.prefetch();

  return (
    <HydrateClient>
      <ProfileView />
    </HydrateClient>
  );
}
