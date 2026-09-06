import type { Metadata } from "next";

import { HydrateClient } from "~/trpc/server";
import { CreatureDetail } from "./CreatureDetail";

export const metadata: Metadata = { title: "Creature — HaduMon" };

export default async function CreatureDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <HydrateClient>
      <CreatureDetail id={id} />
    </HydrateClient>
  );
}
