"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { PixelSprite } from "~/components/PixelSprite";
import { Button } from "~/components/ui";
import { api } from "~/trpc/react";

export interface AuthFormProps {
  mode: "login" | "signup";
}

const COPY = {
  login: {
    heading: "Welcome back",
    intro: "The cats have kept themselves busy.",
    submit: "Sign in",
    pending: "Signing in…",
    switchText: "No account yet?",
    switchHref: "/signup",
    switchLabel: "Create one",
  },
  signup: {
    heading: "Start a run",
    intro: "Six rivals are waiting. None of them have read the rules either.",
    submit: "Create account",
    pending: "Creating account…",
    switchText: "Already have an account?",
    switchHref: "/login",
    switchLabel: "Sign in",
  },
} as const;

export function AuthForm({ mode }: AuthFormProps) {
  const copy = COPY[mode];
  const router = useRouter();
  const utils = api.useUtils();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSuccess = async (destination: string) => {
    setError(null);
    await utils.invalidate();
    router.push(destination);
    router.refresh();
  };

  const login = api.auth.login.useMutation({
    onSuccess: () => onSuccess("/"),
    onError: (e) => setError(e.message),
  });
  const signup = api.auth.signup.useMutation({
    onSuccess: () => onSuccess("/run"),
    onError: (e) => setError(e.message),
  });
  const pending = login.isPending || signup.isPending;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const payload = { username: username.trim(), password };
    if (mode === "login") login.mutate(payload);
    else signup.mutate(payload);
  };

  const fillDemo = () => {
    setUsername("demo");
    setPassword("demo1234");
    setError(null);
  };

  return (
    <main className="auth-page bg-sky-surface flex min-h-dvh items-center justify-center p-3 sm:p-6">
      <div className="auth-shell bg-cream grid w-full max-w-[980px] overflow-hidden rounded-[28px] shadow-[0_28px_80px_rgb(13_60_157_/_0.2)] lg:grid-cols-[0.92fr_1.08fr]">
        <div className="order-2 m-3 mt-0 flex min-h-36 flex-col justify-between overflow-hidden rounded-2xl bg-white px-5 pt-4 sm:min-h-52 lg:order-1 lg:m-5 lg:min-h-[600px] lg:px-8 lg:pt-8">
          <div className="hidden lg:block">
            <p className="text-cobalt text-sm font-extrabold tracking-[0.14em] uppercase">
              A roguelike about cats
            </p>
            <p className="text-ink mt-3 max-w-[12ch] text-3xl leading-tight font-extrabold">
              Six rivals. Twelve turns each.
            </p>
          </div>
          <PixelSprite
            catId="flameclaw"
            size={320}
            label="Flameclaw"
            className="auth-mascot mx-auto mt-auto h-auto w-full max-w-[160px] pb-4 lg:max-w-[320px] lg:pb-8"
          />
        </div>

        <div className="order-1 flex flex-col justify-center p-5 sm:p-8 lg:order-2 lg:p-12">
          <Link
            href="/"
            aria-label="HaduMon home"
            className="text-pixel text-ink mb-8 w-fit text-2xl tracking-[-0.035em] sm:text-3xl"
          >
            Hadu<span className="text-pink">Mon</span>
          </Link>

          <div className="max-w-md">
            <h1 className="text-ink text-4xl sm:text-5xl">{copy.heading}</h1>
            <p className="text-ink-soft mt-3 text-base leading-relaxed">
              {copy.intro}
            </p>

            <form
              onSubmit={submit}
              aria-busy={pending}
              className="mt-7 space-y-5"
            >
              <label className="block">
                <span className="text-ink mb-2 block text-sm font-extrabold">
                  Username
                </span>
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  minLength={3}
                  maxLength={20}
                  disabled={pending}
                  className="border-edge focus:border-cobalt min-h-12 w-full rounded-xl border bg-white px-4 text-base transition-colors outline-none disabled:opacity-60"
                />
              </label>

              <label className="block">
                <span className="text-ink mb-2 block text-sm font-extrabold">
                  Password
                </span>
                <span className="relative block">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                    required
                    minLength={8}
                    disabled={pending}
                    className="border-edge focus:border-cobalt min-h-12 w-full rounded-xl border bg-white px-4 pr-14 text-base transition-colors outline-none disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                    className="text-cobalt absolute inset-y-0 right-1 flex min-w-12 items-center justify-center rounded-lg"
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </span>
              </label>

              <div className="min-h-11" aria-live="polite">
                {error ? (
                  <p
                    role="alert"
                    className="bg-coral/10 text-ink rounded-xl px-3 py-2.5 text-sm font-semibold"
                  >
                    {error}
                  </p>
                ) : null}
              </div>

              <Button
                type="submit"
                disabled={pending}
                className="w-full"
                size="lg"
              >
                {pending ? copy.pending : copy.submit}
              </Button>

              {mode === "login" ? (
                <button
                  type="button"
                  onClick={fillDemo}
                  disabled={pending}
                  className="text-cobalt decoration-cobalt/30 hover:bg-sky-soft min-h-12 w-full rounded-full text-sm font-extrabold underline underline-offset-4 disabled:opacity-50"
                >
                  Use demo account
                </button>
              ) : (
                <div className="bg-sky-soft rounded-xl p-4">
                  <p className="text-ink text-sm font-extrabold">
                    Nothing is for sale
                  </p>
                  <p className="text-ink-soft mt-1 text-sm">
                    No currency, no shop. An account only saves your run.
                  </p>
                </div>
              )}
            </form>

            <p className="text-ink-soft mt-6 text-sm">
              {copy.switchText}{" "}
              <Link
                href={copy.switchHref}
                className="text-cobalt decoration-cobalt/30 font-extrabold underline underline-offset-4"
              >
                {copy.switchLabel}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

function EyeIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-5 fill-none stroke-current"
      strokeWidth="2"
    >
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-5 fill-none stroke-current"
      strokeWidth="2"
    >
      <path d="m3 3 18 18M10.6 6.2A9.8 9.8 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-2.1 2.8M6.2 6.2C3.8 8 2.5 12 2.5 12s3.5 6 9.5 6c1.1 0 2.2-.2 3.1-.5M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}
