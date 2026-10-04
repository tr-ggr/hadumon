import { Panel } from "./Panel";

export interface SkeletonProps {
  /** Tailwind height class, e.g. `h-4`. */
  className?: string;
}

/** A single shimmering placeholder bar. */
export function Skeleton({ className = "h-4 w-full" }: SkeletonProps) {
  return (
    <span
      aria-hidden
      className={`bg-panel-hi block animate-pulse border border-[color:var(--color-edge)] ${className}`}
    />
  );
}

export interface PanelSkeletonProps {
  title?: string;
  /** How many placeholder rows to draw. */
  lines?: number;
  className?: string;
}

/**
 * Panel-shaped loading state. Every page uses this instead of bare "Loading…"
 * text so the layout does not jump once the query resolves.
 */
export function PanelSkeleton({
  title = "Loading",
  lines = 3,
  className = "",
}: PanelSkeletonProps) {
  return (
    <Panel title={title} className={className}>
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
    </Panel>
  );
}

/** Grid of card-shaped placeholders, for boards of cats. */
export function CardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <ul
      role="status"
      aria-busy="true"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
    >
      <span className="sr-only">Loading…</span>
      {Array.from({ length: count }, (_, index) => (
        <li key={index} className="panel-flat space-y-2 p-3">
          <Skeleton className="mx-auto h-16 w-16" />
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </li>
      ))}
    </ul>
  );
}
