import type { ReactNode } from "react";

/**
 * A page that is a room of the tower with one column: its name on a cream
 * plate, then its boards.
 */
export function RoomFrame({
  title,
  lead,
  children,
}: {
  title: string;
  /** Beside the plate: a link back, or a line on what the page is. */
  lead?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="in-room mx-auto flex w-full max-w-[1180px] flex-col gap-5 [--cast:var(--board-cast)] [--mat-cast:var(--board-cast)]">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <h1 className="piece border-ink bg-cream text-print max-w-full border-2 px-3 py-2 text-3xl break-words sm:text-[40px]">
          {title}
        </h1>
        {lead}
      </header>
      <div className="flex min-w-0 flex-col gap-7">{children}</div>
    </div>
  );
}
