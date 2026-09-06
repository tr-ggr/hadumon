import type { Metadata } from "next";

import { AuthForm } from "./AuthForm";

export const metadata: Metadata = { title: "Sign in — HaduMon" };

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
