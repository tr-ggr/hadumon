import type { Metadata } from "next";

import { ResetPasswordForm } from "~/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Choose a new password — HaduMon",
  // The address carries a one-time token; it has no business in an index.
  robots: { index: false },
  referrer: "no-referrer",
};

/**
 * Where an emailed reset link lands. Better Auth checks the link first and
 * sends the visitor on with `?token=…`, or with `?error=…` when it is spent
 * or too old. Open to a signed-in visitor too: the link may be for another
 * account than the one this browser is signed in to.
 */
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[]; error?: string }>;
}) {
  const { token, error } = await searchParams;
  const usable = !error && typeof token === "string" && token.length > 0;

  return <ResetPasswordForm token={usable ? token : null} />;
}
