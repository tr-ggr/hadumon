import { LandingPage } from "~/components/landing/LandingPage";
import { getCurrentUser } from "~/server/auth/session";
import { HomeDashboard } from "./HomeDashboard";

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) return <LandingPage />;

  return <HomeDashboard displayName={user.displayName} />;
}
