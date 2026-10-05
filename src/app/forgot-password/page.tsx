import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ForgotPasswordForm } from "~/components/auth/ForgotPasswordForm";
import { getCurrentUser } from "~/server/auth/session";

export const metadata: Metadata = { title: "Forgot password — HaduMon" };

export default async function ForgotPasswordPage() {
  // A signed-in player has no use for this page; a stale cookie still does.
  if (await getCurrentUser()) redirect("/");

  return <ForgotPasswordForm />;
}
