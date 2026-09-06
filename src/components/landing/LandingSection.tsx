import type { ReactNode } from "react";

export interface SectionHeadingProps {
  /** Small gold label above the title, e.g. `THE CATALOGUE`. */
  kicker: string;
  title: ReactNode;
  /** One or two dry lines under the title. */
  intro?: ReactNode;
  className?: string;
}

/**
 * The landing page's one heading shape: gold pixel kicker, pixel title, VT323
 * intro. Server-safe — the scroll reveal lives in `useReveal`.
 */
export function SectionHeading({
  kicker,
  title,
  intro,
  className = "",
}: SectionHeadingProps) {
  return (
    <header className={`space-y-2 ${className}`}>
      <p className="text-pixel text-gold text-[8px] tracking-widest uppercase">
        {kicker}
      </p>
      <h2 className="text-pixel text-ink text-xs leading-relaxed sm:text-base">
        {title}
      </h2>
      {intro ? (
        <p className="text-ink-dim max-w-prose text-xl leading-snug">{intro}</p>
      ) : null}
    </header>
  );
}
