"use client";

import { useState, type FormEvent } from "react";

import { Field, TableButton } from "~/components/ui";
import { authClient } from "~/lib/auth-client";
import { authErrorMessage, GENERIC_AUTH_ERROR } from "~/lib/auth/errors";
import {
  firstIssue,
  PASSWORD_MAX_LENGTH,
  signupSchema,
} from "~/lib/auth/validation";
import { AuthScreen, FormError, FormFooter } from "./AuthScreen";
import { PasswordField } from "./PasswordField";
import { PasswordStrength } from "./PasswordStrength";
import { useEnterApp } from "./useEnterApp";

export function SignupForm() {
  const enterApp = useEnterApp();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = signupSchema.safeParse({
      username: username.trim(),
      email,
      password,
      confirmPassword,
    });
    if (!parsed.success) {
      setError(firstIssue(parsed.error));
      return;
    }

    setError(null);
    setPending(true);
    try {
      const result = await authClient.signUp.email({
        name: parsed.data.username,
        email: parsed.data.email,
        password: parsed.data.password,
      });
      if (result.error) {
        setError(authErrorMessage(result.error));
        setPending(false);
        return;
      }
      // Stays pending: the page is on its way out.
      await enterApp("/run");
    } catch {
      setError(GENERIC_AUTH_ERROR);
      setPending(false);
    }
  };

  return (
    <AuthScreen
      heading="Start a run"
      intro="Six rivals are waiting. None of them have read the rules either."
      lidLink={{ href: "/login", label: "Sign in" }}
    >
      <form
        onSubmit={submit}
        noValidate
        aria-busy={pending}
        className="mt-6 space-y-4"
      >
        <Field
          label="Username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="nickname"
          autoCapitalize="none"
          spellCheck={false}
          required
          maxLength={20}
          disabled={pending}
        />
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
        <div>
          <PasswordField
            label="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            required
            maxLength={PASSWORD_MAX_LENGTH}
            disabled={pending}
            visible={visible}
            onToggleVisible={() => setVisible((shown) => !shown)}
          />
          <PasswordStrength
            password={password}
            userInputs={[username, email]}
          />
        </div>
        <PasswordField
          label="Retype password"
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
          {pending ? "Creating account…" : "Create account"}
        </TableButton>

        <div className="tray-well p-3">
          <p className="text-sm font-extrabold">Nothing is for sale</p>
          <p className="mt-1 text-sm">
            No currency, no shop. An account only saves your run.
          </p>
        </div>
      </form>

      <FormFooter
        text="Already have an account?"
        href="/login"
        label="Sign in"
      />
    </AuthScreen>
  );
}
