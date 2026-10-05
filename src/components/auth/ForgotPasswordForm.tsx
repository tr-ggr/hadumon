"use client";

import { useState, type FormEvent } from "react";

import { Field, TableButton, TableLink } from "~/components/ui";
import { authClient } from "~/lib/auth-client";
import {
  authErrorMessage,
  GENERIC_AUTH_ERROR,
  RATE_LIMIT_ERROR,
} from "~/lib/auth/errors";
import { firstIssue, forgotSchema } from "~/lib/auth/validation";
import { AuthScreen, FormError, FormFooter } from "./AuthScreen";

const SIGN_IN = { href: "/login", label: "Sign in" };

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = forgotSchema.safeParse({ email });
    if (!parsed.success) {
      setError(firstIssue(parsed.error));
      return;
    }

    setError(null);
    setPending(true);
    try {
      const result = await authClient.requestPasswordReset({
        email: parsed.data.email,
        redirectTo: "/reset-password",
      });
      // Only being asked too often is worth telling: anything else about
      // the address would say whether it has an account.
      if (result.error?.status === 429) setError(RATE_LIMIT_ERROR);
      else if (result.error && result.error.status >= 500) {
        setError(authErrorMessage(null));
      } else setSent(true);
    } catch {
      setError(GENERIC_AUTH_ERROR);
    }
    setPending(false);
  };

  if (sent) {
    return (
      <AuthScreen
        heading="Check your email"
        intro="If an account uses that address, a link to choose a new password is on its way. It works once, for an hour."
        lidLink={SIGN_IN}
      >
        <TableLink
          href="/login"
          variant="primary"
          size="lg"
          className="mt-6 w-full"
        >
          Back to sign in
        </TableLink>
        <p className="mt-6 text-sm">
          Nothing after a few minutes? Look in spam, or{" "}
          <button
            type="button"
            onClick={() => setSent(false)}
            className="font-extrabold underline underline-offset-4"
          >
            try another address
          </button>
          .
        </p>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      heading="Forgot your password?"
      intro="The cats will not say what it was. Give the email on your account and we will send a link to choose a new one."
      lidLink={SIGN_IN}
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

        <FormError message={error} />

        <TableButton
          size="lg"
          type="submit"
          disabled={pending}
          className="w-full"
        >
          {pending ? "Sending…" : "Send reset link"}
        </TableButton>
      </form>

      <FormFooter text="Remembered it?" href="/login" label="Sign in" />
    </AuthScreen>
  );
}
