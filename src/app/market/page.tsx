import type { Metadata } from "next";

import { HydrateClient } from "~/trpc/server";
import { MarketView } from "./MarketView";

export const metadata: Metadata = { title: "Market — HaduMon" };

export default function MarketPage() {
  return (
    <HydrateClient>
      <MarketView />
    </HydrateClient>
  );
}
