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
    submit: "Sign in",
    switchText: "No account yet?",
    switchHref: "/signup",
    switchLabel: "Create one",
    hint: "Try the demo account: demo / demo1234",
  },
  signup: {
    heading: "New trainer",
    submit: "Create account",
    switchText: "Already a trainer?",
    switchHref: "/login",
    switchLabel: "Sign in",
    hint: "You start with 1000 gems, 500 gold and 3 starter cats.",
  },
} as const;

export function AuthForm({ mode }: AuthFormProps) {
  const copy = COPY[mode];
  const router = useRouter();
  const utils = api.useUtils();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSuccess = async () => {
    setError(null);
    await utils.invalidate();
    router.push("/");
    router.refresh();
  };

  const login = api.auth.login.useMutation({
    onSuccess,
    onError: (e) => setError(e.message),
  });
  const signup = api.auth.signup.useMutation({
    onSuccess,
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

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 py-8">
      <div className="flex items-end gap-1">
        <PixelSprite speciesId="flameclaw" size={56} />
        <PixelSprite speciesId="mistpaw" size={72} />
        <PixelSprite speciesId="voltwhisk" size={56} />
      </div>

      <h1 className="text-pixel text-lg text-gold">
        Hadu<span className="text-pink">Mon</span>
      </h1>

      <form onSubmit={submit} className="panel w-full max-w-sm space-y-3 p-4">
        <h2 className="text-pixel text-[10px] text-mint">{copy.heading}</h2>

        <label className="block space-y-1">
          <span className="text-pixel text-[8px] text-ink-dim uppercase">Username</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
            minLength={3}
            maxLength={20}
            className="w-full border-2 border-edge bg-navy-deep px-2 py-1.5 text-lg text-ink outline-none focus:border-gold"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-pixel text-[8px] text-ink-dim uppercase">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            minLength={8}
            className="w-full border-2 border-edge bg-navy-deep px-2 py-1.5 text-lg text-ink outline-none focus:border-gold"
          />
        </label>

        {error ? (
          <p role="alert" className="border-2 border-pink bg-navy-deep px-2 py-1 text-base text-pink">
            {error}
          </p>
        ) : null}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "…" : copy.submit}
        </Button>

        <p className="text-base text-ink-dim">
          {copy.switchText}{" "}
          <Link href={copy.switchHref} className="text-mint underline">
            {copy.switchLabel}
          </Link>
        </p>
      </form>

      <p className="max-w-sm text-center text-base text-ink-dim">{copy.hint}</p>
    </main>
  );
}
