import type { ReactNode } from "react";

import { pixelFont } from "~/styles/fonts";

import { Label, TableButton } from "./pieces";
import { TableNav } from "./TableNav";

/**
 * The cloth every screen of a run is laid on. It opens the `.tabletop`
 * scope, inside which a piece gains its cardboard thickness and the pixel
 * face is available for print. The ways off the table sit in its top right
 * corner on every screen, and a slow light drifts on the cloth under it all.
 */
export function TableSurface({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`tabletop ${pixelFont.variable} relative isolate flex min-w-0 flex-1 flex-col ${className}`}
    >
      <span aria-hidden className="cloth-light" />
      <TableNav className="absolute top-2 right-2 z-30 sm:right-3" />
      {children}
    </div>
  );
}

/** The part of the cloth a screen lays its pieces on, clear of the corner. */
export function TableArea({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`mx-auto w-full max-w-[1120px] flex-1 px-3 pt-14 pb-8 sm:px-5 ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * The player's edge of the table, docked to the bottom of the screen. Every
 * choice in a run ends here: a sentence saying what will happen, and one
 * confirm.
 */
export function TableRail({ children }: { children: ReactNode }) {
  return (
    <div className="rail sticky bottom-0 z-20">
      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        {children}
      </div>
    </div>
  );
}

export interface StepRailProps {
  /** Zero-based. */
  index: number;
  count: number;
  /** What the step has settled, or what comes next, in one sentence. */
  children: ReactNode;
  /** Omit on the first step, which has nothing behind it. */
  onBack?: () => void;
  nextLabel: string;
  onNext: () => void;
  /** Holds both buttons while the last step's confirm is being sent. */
  disabled?: boolean;
}

/**
 * The rail of a screen that is one step of several: where the player is in
 * the sequence, the sentence, a cream Back and the one cobalt way forward.
 */
export function StepRail({
  index,
  count,
  children,
  onBack,
  nextLabel,
  onNext,
  disabled = false,
}: StepRailProps) {
  return (
    <TableRail>
      <div className="min-w-0">
        {count > 1 ? (
          <Label>
            Step {index + 1} of {count}
          </Label>
        ) : null}
        <p className="text-ink text-sm font-semibold" aria-live="polite">
          {children}
        </p>
      </div>
      <div className="flex gap-2 sm:shrink-0">
        {onBack ? (
          <TableButton
            variant="secondary"
            size="md"
            disabled={disabled}
            onClick={onBack}
          >
            Back
          </TableButton>
        ) : null}
        <TableButton
          size="md"
          disabled={disabled}
          onClick={onNext}
          className="flex-1 sm:flex-none"
        >
          {nextLabel}
        </TableButton>
      </div>
    </TableRail>
  );
}
