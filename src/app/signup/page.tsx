import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "~/app/login/AuthForm";
import { getCurrentUser } from "~/server/auth/session";

export const metadata: Metadata = { title: "Create account — HaduMon" };

export default async function SignupPage() {
  // A signed-in player has no use for this page; a stale cookie still does.
  if (await getCurrentUser()) redirect("/");

  return <AuthForm mode="signup" />;
}
