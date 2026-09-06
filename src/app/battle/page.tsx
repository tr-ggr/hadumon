import type { Metadata } from "next";

import { HydrateClient } from "~/trpc/server";
import { BattleTabs } from "./BattleTabs";

export const metadata: Metadata = { title: "Battle — HaduMon" };

export default function BattlePage() {
  return (
    <HydrateClient>
      <BattleTabs />
    </HydrateClient>
  );
}
