import { Board } from "./Board";

export interface SkeletonProps {
  /** Tailwind height class, e.g. `h-4`. */
  className?: string;
}

/** A blank of chipboard where something is still to be printed. */
export function Skeleton({ className = "h-4 w-full" }: SkeletonProps) {
  return <span aria-hidden className={`blank block ${className}`} />;
}

export interface BoardSkeletonProps {
  title?: string;
  /** How many placeholder rows to draw. */
  lines?: number;
  className?: string;
}

/**
 * Board-shaped loading state. Every page uses this instead of bare "Loading…"
 * text so the layout does not jump once the query resolves.
 */
export function BoardSkeleton({
  title = "Loading",
  lines = 3,
  className = "",
}: BoardSkeletonProps) {
  return (
    <Board title={title} className={className}>
      <div
        role="status"
        aria-busy="true"
        aria-live="polite"
        className="grid gap-2"
      >
        <span className="sr-only">Loading…</span>
        {Array.from({ length: lines }, (_, index) => (
          <Skeleton
            key={index}
            className={`h-4 ${index % 3 === 2 ? "w-1/2" : index % 2 === 0 ? "w-full" : "w-3/4"}`}
          />
        ))}
      </div>
    </Board>
  );
}

/** Grid of card-shaped printed spaces, for boards of cats. */
export function CardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <ul
      role="status"
      aria-busy="true"
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
    >
      <span className="sr-only">Loading…</span>
      {Array.from({ length: count }, (_, index) => (
        <li
          key={index}
          className="border-ink/30 flex gap-3 border-2 border-dashed p-3"
        >
          <Skeleton className="h-16 w-16 shrink-0" />
          <span className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-full" />
          </span>
        </li>
      ))}
    </ul>
  );
}
