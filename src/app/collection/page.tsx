import type { Metadata } from "next";

import { HydrateClient } from "~/trpc/server";
import { CollectionGrid } from "./CollectionGrid";

export const metadata: Metadata = { title: "Collection — HaduMon" };

export default function CollectionPage() {
  return (
    <HydrateClient>
      <CollectionGrid />
    </HydrateClient>
  );
}
