import type { ReactNode } from "react";

import { pixelFont } from "~/styles/fonts";

/**
 * The cloth every screen of a run is laid on. It opens the `.tabletop`
 * scope, inside which a piece gains its cardboard thickness and the pixel
 * face is available for print.
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
      className={`tabletop ${pixelFont.variable} flex min-w-0 flex-1 flex-col ${className}`}
    >
      {children}
    </div>
  );
}

/** The part of the cloth a screen lays its pieces on. */
export function TableArea({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`mx-auto w-full max-w-[1120px] flex-1 px-3 pt-3 pb-8 sm:px-5 ${className}`}
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
