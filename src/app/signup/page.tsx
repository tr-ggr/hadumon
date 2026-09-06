import type { Metadata } from "next";

import { AuthForm } from "~/app/login/AuthForm";

export const metadata: Metadata = { title: "Create account — HaduMon" };

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}
