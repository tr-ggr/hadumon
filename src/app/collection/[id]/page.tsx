import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { api, HydrateClient } from "~/trpc/server";
import { CreatureDetail } from "./CreatureDetail";

export const metadata: Metadata = { title: "Creature — HaduMon" };

export default async function CreatureDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Resolve the cat on the server so a bad id renders a real 404 instead of a
  // client-side "not found" panel behind a 200.
  try {
    await api.creatures.get({ id });
  } catch {
    notFound();
  }

  void api.creatures.get.prefetch({ id });

  return (
    <HydrateClient>
      <CreatureDetail id={id} />
    </HydrateClient>
  );
}
