import { PixelSprite } from "~/components/PixelSprite";
import { ButtonLink } from "~/components/ui";

/**
 * The public page at `/` for signed-out visitors. A placeholder: one section
 * with the wordmark, the mascot, one line, and the two account actions.
 */
export function LandingPage() {
  return (
    <main className="bg-cream flex min-h-dvh items-center justify-center px-4 py-10">
      <section className="flex w-full max-w-md flex-col items-center text-center">
        <PixelSprite catId="flameclaw" size={144} label="Flameclaw" />
        <h1 className="text-pixel text-ink mt-6 text-5xl sm:text-6xl">
          Hadu<span className="text-coral">Mon</span>
        </h1>
        <p className="text-ink-soft mt-4 text-lg">
          A roguelike engine-builder about cats. Six rivals. Twelve turns each.
        </p>
        <nav
          aria-label="Account"
          className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center"
        >
          <ButtonLink href="/signup" size="lg">
            Sign up
          </ButtonLink>
          <ButtonLink href="/login" variant="secondary" size="lg">
            Log in
          </ButtonLink>
        </nav>
      </section>
    </main>
  );
}
