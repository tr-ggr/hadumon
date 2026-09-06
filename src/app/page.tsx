import { LandingPage } from "~/components/landing/LandingPage";
import { getCurrentUser } from "~/server/auth/session";
import { api, HydrateClient } from "~/trpc/server";
import { HomeDashboard } from "./HomeDashboard";

export default async function Home() {
  // Signed-out visitors get the landing page. This has to come before the
  // prefetches: every dashboard procedure is protected and would throw.
  const user = await getCurrentUser();
  if (!user) return <LandingPage now={new Date()} />;

  // Warm every dashboard card on the server so the first paint is the real
  // dashboard rather than a screen full of skeletons.
  await Promise.all([
    api.auth.me.prefetch(),
    api.creatures.list.prefetch(),
    api.adventure.current.prefetch(),
    api.gacha.history.prefetch({ limit: 5 }),
    api.gacha.banners.prefetch(),
    api.battle.ladder.prefetch(),
    api.battle.getDefense.prefetch(),
    api.market.incomingTrades.prefetch(),
  ]);

  return (
    <HydrateClient>
      <HomeDashboard />
    </HydrateClient>
  );
}
