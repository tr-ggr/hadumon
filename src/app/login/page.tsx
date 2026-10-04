import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentUser } from "~/server/auth/session";
import { AuthForm } from "./AuthForm";

export const metadata: Metadata = { title: "Sign in — HaduMon" };

export default async function LoginPage() {
  // A signed-in player has no use for this page; a stale cookie still does.
  if (await getCurrentUser()) redirect("/");

  return <AuthForm mode="login" />;
}
