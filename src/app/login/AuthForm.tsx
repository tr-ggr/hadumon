"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type CSSProperties, type FormEvent } from "react";

import { CrowdCat } from "~/components/landing/Crowd";
import { StageFrame } from "~/components/landing/StageFrame";
import { PixelSprite } from "~/components/PixelSprite";
import { Field, TableButton, TableLink } from "~/components/ui";
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
    <div className="flex min-h-dvh flex-col">
      <header className="lid bg-ink text-cream">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-3 px-3 pt-1 pb-2 sm:px-5">
          <Link
            href="/"
            aria-label="HaduMon home"
            className="text-pixel text-xl sm:text-2xl"
          >
            Hadu<span className="text-coral">Mon</span>
          </Link>
          <TableLink href={copy.switchHref} size="sm">
            {copy.switchLabel}
          </TableLink>
        </div>
      </header>

      <main className="auth-page sky-band flex flex-1 items-center justify-center px-3 py-8 sm:px-6 sm:py-12">
        <div className="grid w-full max-w-[920px] items-center gap-x-12 gap-y-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
          <section
            className="board anim-land p-5 sm:p-8"
            style={{ "--board-cast": "var(--color-sky-deep)" } as CSSProperties}
          >
            <h1 className="text-print text-3xl sm:text-[40px]">
              {copy.heading}
            </h1>
            <p className="mt-2 text-base">{copy.intro}</p>

            <form
              onSubmit={submit}
              aria-busy={pending}
              className="mt-6 space-y-4"
            >
              <Field
                label="Username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                required
                minLength={3}
                maxLength={20}
                disabled={pending}
              />
              <Field
                label="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                required
                minLength={8}
                disabled={pending}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                    className="min-h-10 min-w-12 px-2 text-xs font-black underline underline-offset-2"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                }
              />

              <div className="min-h-11" aria-live="polite">
                {error ? (
                  <p
                    role="alert"
                    className="border-ink border-2 bg-white px-3 py-2 text-sm font-bold"
                  >
                    {error}
                  </p>
                ) : null}
              </div>

              <TableButton
                size="lg"
                type="submit"
                disabled={pending}
                className="w-full"
              >
                {pending ? copy.pending : copy.submit}
              </TableButton>

              {mode === "login" ? (
                <TableButton
                  variant="secondary"
                  size="md"
                  onClick={fillDemo}
                  disabled={pending}
                  className="w-full"
                >
                  Use demo account
                </TableButton>
              ) : (
                <div className="tray-well p-3">
                  <p className="text-sm font-extrabold">Nothing is for sale</p>
                  <p className="mt-1 text-sm">
                    No currency, no shop. An account only saves your run.
                  </p>
                </div>
              )}
            </form>

            <p className="mt-6 text-sm">
              {copy.switchText}{" "}
              <Link
                href={copy.switchHref}
                className="font-extrabold underline underline-offset-4"
              >
                {copy.switchLabel}
              </Link>
            </p>
          </section>

          <StageFrame
            className="auth-picture mx-auto w-full max-w-[220px] lg:max-w-none"
            crowd={
              <CrowdCat
                catId="mistpaw"
                size={64}
                order={2}
                cast={false}
                className="right-6 bottom-full"
              />
            }
          >
            <div className="flex flex-col items-center px-4 pt-5 lg:px-8 lg:pt-8">
              <p className="text-print text-center text-xl text-balance lg:text-3xl">
                Six rivals. Twelve turns each.
              </p>
              <PixelSprite
                catId="flameclaw"
                size={256}
                label="Flameclaw"
                className="mt-3 h-auto w-full max-w-[160px] lg:mt-5 lg:max-w-[256px]"
              />
            </div>
          </StageFrame>
        </div>
      </main>
    </div>
  );
}
