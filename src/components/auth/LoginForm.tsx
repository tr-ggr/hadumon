"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { Field, TableButton } from "~/components/ui";
import { authClient } from "~/lib/auth-client";
import { DEMO_EMAIL, DEMO_PASSWORD } from "~/lib/auth/constants";
import { authErrorMessage, GENERIC_AUTH_ERROR } from "~/lib/auth/errors";
import { firstIssue, loginSchema } from "~/lib/auth/validation";
import { AuthScreen, FormError, FormFooter } from "./AuthScreen";
import { PasswordField } from "./PasswordField";
import { useEnterApp } from "./useEnterApp";

export function LoginForm() {
  const enterApp = useEnterApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async (credentials: { email: string; password: string }) => {
    setError(null);
    setPending(true);
    try {
      const result = await authClient.signIn.email(credentials);
      if (result.error) {
        setError(authErrorMessage(result.error));
        setPending(false);
        return;
      }
      // Stays pending: the page is on its way out.
      await enterApp("/");
    } catch {
      setError(GENERIC_AUTH_ERROR);
      setPending(false);
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(firstIssue(parsed.error));
      return;
    }
    void signIn(parsed.data);
  };

  const useDemo = () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    void signIn({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
  };

  return (
    <AuthScreen
      heading="Welcome back"
      intro="The cats have kept themselves busy."
      lidLink={{ href: "/signup", label: "Create one" }}
    >
      <form
        onSubmit={submit}
        noValidate
        aria-busy={pending}
        className="mt-6 space-y-4"
      >
        <Field
          label="Email"
          type="email"
          inputMode="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          disabled={pending}
        />
        {/* The way out for a forgotten password sits on the label's own line,
            at its far end. It comes after the field in the page, so Tab goes
            from the password to it and not through it. */}
        <div className="relative">
          <PasswordField
            label="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
            disabled={pending}
            visible={visible}
            onToggleVisible={() => setVisible((shown) => !shown)}
          />
          <Link
            href="/forgot-password"
            className="absolute top-0 right-0 text-sm font-extrabold underline underline-offset-4 after:absolute after:-inset-x-2 after:-top-3.5 after:-bottom-1.5"
          >
            Forgot password?
          </Link>
        </div>

        <FormError message={error} />

        <TableButton
          size="lg"
          type="submit"
          disabled={pending}
          className="w-full"
        >
          {pending ? "Signing in…" : "Sign in"}
        </TableButton>

        <TableButton
          variant="secondary"
          size="md"
          onClick={useDemo}
          disabled={pending}
          className="w-full"
        >
          Use demo account
        </TableButton>
      </form>

      <FormFooter text="No account yet?" href="/signup" label="Create one" />
    </AuthScreen>
  );
}
