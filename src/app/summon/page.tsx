import type { Metadata } from "next";

import { HydrateClient } from "~/trpc/server";
import { SummonHub } from "./SummonHub";

export const metadata: Metadata = { title: "Summon — HaduMon" };

export default function SummonPage() {
  return (
    <HydrateClient>
      <SummonHub />
    </HydrateClient>
  );
}
