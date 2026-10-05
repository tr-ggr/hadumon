import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import { CrowdCat } from "~/components/landing/Crowd";
import { StageFrame } from "~/components/landing/StageFrame";
import { PixelSprite } from "~/components/PixelSprite";
import { TableLink } from "~/components/ui";

export interface AuthScreenProps {
  heading: string;
  intro: string;
  /** The other form, as the small link at the right of the lid. */
  lidLink: { href: string; label: string };
  children: ReactNode;
}

/**
 * The page every signed-out form stands on: the lid, a sky band, one board
 * that lands once, and the picture beside it.
 */
export function AuthScreen({
  heading,
  intro,
  lidLink,
  children,
}: AuthScreenProps) {
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
          <TableLink href={lidLink.href} size="sm">
            {lidLink.label}
          </TableLink>
        </div>
      </header>

      <main className="auth-page sky-band flex flex-1 items-center justify-center px-3 py-8 sm:px-6 sm:py-12">
        <div className="grid w-full max-w-[920px] items-center gap-x-12 gap-y-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
          <section
            className="board anim-land p-5 sm:p-8"
            style={{ "--board-cast": "var(--color-sky-deep)" } as CSSProperties}
          >
            <h1 className="text-print text-3xl text-balance sm:text-[40px]">
              {heading}
            </h1>
            <p className="mt-2 text-base text-pretty">{intro}</p>
            {children}
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
                Six rivals. Twenty-six turns each.
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

/**
 * The one line kept under a form's fields for what went wrong. Its 44px are
 * there whether or not it has anything to say, so the form does not jump.
 */
export function FormError({ message }: { message: string | null }) {
  return (
    <div className="min-h-11" aria-live="polite">
      {message ? (
        <p
          role="alert"
          className="border-ink border-2 bg-white px-3 py-2 text-sm font-bold"
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}

/** The line under a form that leads to another one. */
export function FormFooter({
  text,
  href,
  label,
}: {
  text: string;
  href: string;
  label: string;
}) {
  return (
    <p className="mt-6 text-sm">
      {text}{" "}
      <Link href={href} className="font-extrabold underline underline-offset-4">
        {label}
      </Link>
    </p>
  );
}
