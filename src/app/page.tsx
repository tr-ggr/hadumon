import { HydrateClient } from "~/trpc/server";
import { HomeDashboard } from "./HomeDashboard";

export default function Home() {
  return (
    <HydrateClient>
      <HomeDashboard />
    </HydrateClient>
  );
}
