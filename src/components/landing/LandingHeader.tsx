import Link from "next/link";
import type { ReactNode } from "react";

import { SECTION_SHELL } from "./LandingSection";

type ActionVariant = "primary" | "secondary";
type ActionSize = "sm" | "md";

/** Mirrors `Button`'s variants — see {@link ActionLink} for why it is copied. */
const ACTION_VARIANTS: Record<ActionVariant, string> = {
  primary: "bg-gold text-navy border-navy hover:bg-[#ffd968]",
  secondary: "bg-panel-hi text-ink border-edge hover:bg-edge",
};

const ACTION_SIZES: Record<ActionSize, string> = {
  sm: "px-2 py-1 text-[10px]",
  md: "px-3 py-2 text-xs",
};

export interface ActionLinkProps {
  href: string;
  variant?: ActionVariant;
  size?: ActionSize;
  className?: string;
  children: ReactNode;
}

/**
 * A navigation link wearing the pixel button's costume: same border, hard
 * offset shadow and press, but a real anchor.
 *
 * The rest of the app nests `Button` inside `Link`, which puts a button a
 * keyboard user can focus but not activate inside the anchor that actually
 * navigates. The landing page is the first thing a stranger meets, so its two
 * account actions are plain links. Shared with `SummonAltar`'s empty-wallet
 * call to action.
 */
export function ActionLink({
  href,
  variant = "primary",
  size = "md",
  className = "",
  children,
}: ActionLinkProps) {
  return (
    <Link
      href={href}
      className={`text-pixel pixel-press focus-visible:outline-gold inline-flex min-h-11 items-center justify-center gap-2 border-2 text-center shadow-[3px_3px_0_#000] focus-visible:outline-2 focus-visible:outline-offset-2 ${ACTION_VARIANTS[variant]} ${ACTION_SIZES[size]} ${className}`}
    >
      {children}
    </Link>
  );
}

/**
 * Sticky landing header: wordmark left, the two account actions right.
 *
 * Deliberately 62px tall (44px touch targets plus the 2px edge) — the hero
 * below subtracts exactly that to fill the first viewport.
 */
export function LandingHeader() {
  return (
    <header className="border-edge bg-panel sticky top-0 z-20 border-b-2">
      <div className={`${SECTION_SHELL} flex items-center gap-2 py-2`}>
        <Link
          href="/"
          className="text-pixel text-gold focus-visible:outline-gold shrink-0 text-xs focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Hadu<span className="text-pink">Mon</span>
        </Link>

        <nav aria-label="Account" className="ml-auto flex items-center gap-1.5">
          <ActionLink
            href="/login"
            variant="secondary"
            size="sm"
            className="sm:px-3 sm:py-2 sm:text-xs"
          >
            Log in
          </ActionLink>
          <ActionLink
            href="/signup"
            variant="primary"
            size="sm"
            className="sm:px-3 sm:py-2 sm:text-xs"
          >
            Create account
          </ActionLink>
        </nav>
      </div>
    </header>
  );
}
