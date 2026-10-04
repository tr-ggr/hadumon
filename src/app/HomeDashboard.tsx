import Link from "next/link";

import { PixelSprite } from "~/components/PixelSprite";
import { ButtonLink } from "~/components/ui";

export interface HomeDashboardProps {
  displayName: string;
}

/** The signed-in home: the mascot, the way into a run, and the codex. */
export function HomeDashboard({ displayName }: HomeDashboardProps) {
  return (
    <div className="page-wrap">
      <section className="surface-sky flex flex-col items-center gap-6 rounded-[28px] p-6 text-center sm:flex-row sm:gap-8 sm:p-9 sm:text-left">
        <PixelSprite
          catId="flameclaw"
          size={144}
          label="Flameclaw"
          className="shrink-0"
        />
        <div className="min-w-0">
          <h1 className="text-ink text-3xl break-words sm:text-5xl">
            Welcome back, {displayName}
          </h1>
          <p className="text-ink mt-3 text-lg">
            Six rivals are waiting. None of them are in a hurry.
          </p>
          <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row">
            <ButtonLink href="/run" size="lg" className="w-full sm:w-auto">
              Play
            </ButtonLink>
            <Link
              href="/codex"
              className="text-cobalt-dark inline-flex min-h-12 items-center font-extrabold underline underline-offset-4"
            >
              Open the codex
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
