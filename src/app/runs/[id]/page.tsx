import type { Metadata } from "next";

import { VisitorFrame } from "~/components/players/VisitorFrame";
import { RunRecordView } from "~/components/runs/RunRecordView";
import { getCurrentUser } from "~/server/auth/session";
import { api, HydrateClient } from "~/trpc/server";

export const metadata: Metadata = { title: "Run summary — HaduMon" };

const UUID = /^[0-9a-f-]{36}$/i;

interface Params {
  params: Promise<{ id: string }>;
}

/** One finished run, everything it did. Shared runs may be opened by anyone. */
export default async function RunRecordPage({ params }: Params) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (UUID.test(id)) await api.run.record.prefetch({ id });

  return (
    <HydrateClient>
      <VisitorFrame signedIn={user !== null}>
        <RunRecordView id={id} signedIn={user !== null} />
      </VisitorFrame>
    </HydrateClient>
  );
}
