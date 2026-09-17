import type { ReactNode } from "react";

/**
 * The page's one horizontal shell: the same measure and the same gutters for
 * every section, so nothing on the page is a pixel out of column.
 */
export const SECTION_SHELL = "mx-auto w-full max-w-6xl px-3 sm:px-4";

/**
 * The page's one vertical rhythm. Asymmetric on purpose: a heading gets more
 * air above it than below, so each section reads as the start of something
 * rather than the tail of the last one.
 */
export const SECTION_RHYTHM = "pt-16 pb-12 sm:pt-24 sm:pb-16";

/** The gap between a heading and the block it introduces — half the rhythm. */
export const SECTION_GAP = "space-y-6 sm:space-y-8";

export interface LandingSectionProps {
  /** `id` of the section's own `SectionHeading` title. */
  labelledBy?: string;
  className?: string;
  children: ReactNode;
}

/**
 * A landing section in the page rhythm: shell, vertical spacing, and the gap
 * between the heading and its body. Sections that need to break the column —
 * the full-bleed element bands, the close — compose {@link SECTION_SHELL} and
 * {@link SECTION_RHYTHM} by hand instead.
 */
export function LandingSection({
  labelledBy,
  className = "",
  children,
}: LandingSectionProps) {
  return (
    <section
      aria-labelledby={labelledBy}
      className={`${SECTION_SHELL} ${SECTION_RHYTHM} ${SECTION_GAP} ${className}`}
    >
      {children}
    </section>
  );
}

export interface SectionHeadingProps {
  title: ReactNode;
  /** Put on the `h2`, so the section can be `aria-labelledby` it. */
  titleId?: string;
  /** One or two dry lines under the title. */
  intro?: ReactNode;
  /** `gold` is reserved for the close; every content section is `ink`. */
  tone?: "ink" | "gold";
  align?: "start" | "center";
  className?: string;
}

const TITLE_TONES: Record<"ink" | "gold", string> = {
  ink: "text-ink",
  gold: "text-gold",
};

/**
 * The landing page's one heading shape: bold title and readable intro. No eyebrow
 * label above it — the world's gold pixel labels are data labels inside panels
 * (GOLD, PITY, RATE-UP), and the heading has to carry itself. Server-safe —
 * the scroll reveal lives in `useReveal`.
 */
export function SectionHeading({
  title,
  titleId,
  intro,
  tone = "ink",
  align = "start",
  className = "",
}: SectionHeadingProps) {
  const centred = align === "center";

  return (
    <header
      className={`space-y-2 ${centred ? "text-center" : ""} ${className}`}
    >
      <h2
        id={titleId}
        className={`text-pixel text-3xl leading-tight text-balance sm:text-5xl ${TITLE_TONES[tone]}`}
      >
        {title}
      </h2>
      {intro ? (
        <p
          className={`text-ink-dim max-w-2xl text-lg leading-relaxed text-pretty ${centred ? "mx-auto" : ""}`}
        >
          {intro}
        </p>
      ) : null}
    </header>
  );
}
