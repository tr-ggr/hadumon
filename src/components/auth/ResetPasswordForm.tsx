"use client";

import { useState, type FormEvent } from "react";

import { TableButton, TableLink } from "~/components/ui";
import { authClient } from "~/lib/auth-client";
import {
  authErrorMessage,
  GENERIC_AUTH_ERROR,
  isExpiredLink,
} from "~/lib/auth/errors";
import {
  firstIssue,
  PASSWORD_MAX_LENGTH,
  resetSchema,
} from "~/lib/auth/validation";
import { AuthScreen, FormError, FormFooter } from "./AuthScreen";
import { PasswordField } from "./PasswordField";
import { PasswordStrength } from "./PasswordStrength";

const SIGN_IN = { href: "/login", label: "Sign in" };

export interface ResetPasswordFormProps {
  /** The token from the emailed link; null when the link is spent or old. */
  token: string | null;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<"form" | "expired" | "done">(
    token ? "form" : "expired",
  );

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;
    const parsed = resetSchema.safeParse({ password, confirmPassword });
    if (!parsed.success) {
      setError(firstIssue(parsed.error));
      return;
    }

    setError(null);
    setPending(true);
    try {
      const result = await authClient.resetPassword({
        newPassword: parsed.data.password,
        token,
      });
      if (!result.error) setStage("done");
      else if (isExpiredLink(result.error)) setStage("expired");
      else setError(authErrorMessage(result.error));
    } catch {
      setError(GENERIC_AUTH_ERROR);
    }
    setPending(false);
  };

  if (stage === "expired") {
    return (
      <AuthScreen
        heading="This link has run out"
        intro="A reset link works once, for an hour. This one is spent or too old. Ask for a fresh one."
        lidLink={SIGN_IN}
      >
        <TableLink
          href="/forgot-password"
          variant="primary"
          size="lg"
          className="mt-6 w-full"
        >
          Send a new link
        </TableLink>
        <FormFooter text="Remembered it?" href="/login" label="Sign in" />
      </AuthScreen>
    );
  }

  if (stage === "done") {
    return (
      <AuthScreen
        heading="Password changed"
        intro="Every device that was signed in has been signed out. Sign in with the new one."
        lidLink={SIGN_IN}
      >
        <TableLink
          href="/login"
          variant="primary"
          size="lg"
          className="mt-6 w-full"
        >
          Sign in
        </TableLink>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      heading="Choose a new password"
      intro="Something the cats could not guess."
      lidLink={SIGN_IN}
    >
      <form
        onSubmit={submit}
        noValidate
        aria-busy={pending}
        className="mt-6 space-y-4"
      >
        <div>
          <PasswordField
            label="New password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            required
            maxLength={PASSWORD_MAX_LENGTH}
            disabled={pending}
            visible={visible}
            onToggleVisible={() => setVisible((shown) => !shown)}
          />
          <PasswordStrength password={password} />
        </div>
        <PasswordField
          label="Retype new password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          autoComplete="new-password"
          required
          maxLength={PASSWORD_MAX_LENGTH}
          disabled={pending}
          visible={visible}
        />

        <FormError message={error} />

        <TableButton
          size="lg"
          type="submit"
          disabled={pending}
          className="w-full"
        >
          {pending ? "Saving…" : "Save new password"}
        </TableButton>
      </form>
    </AuthScreen>
  );
}
