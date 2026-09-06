import type { Metadata } from "next";

import { HydrateClient } from "~/trpc/server";
import { AdventureView } from "./AdventureView";

export const metadata: Metadata = { title: "Adventure — HaduMon" };

export default function AdventurePage() {
  return (
    <HydrateClient>
      <AdventureView />
    </HydrateClient>
  );
}
