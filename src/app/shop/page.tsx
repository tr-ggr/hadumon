import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentUser } from "~/server/auth/session";
import { api, HydrateClient } from "~/trpc/server";
import { ShopView } from "./ShopView";

export const metadata: Metadata = { title: "Shop — HaduMon" };

export default async function ShopPage() {
  // The middleware only checks that a cookie exists; this checks it is valid.
  if (!(await getCurrentUser())) redirect("/");

  await api.shop.packs.prefetch();

  return (
    <HydrateClient>
      <ShopView />
    </HydrateClient>
  );
}
