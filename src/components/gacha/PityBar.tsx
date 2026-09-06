export interface PityBarProps {
  count: number;
  threshold: number;
  className?: string;
}

/** "37/50" progress toward the guaranteed epic+. */
export function PityBar({ count, threshold, className = "" }: PityBarProps) {
  const safeThreshold = Math.max(1, threshold);
  const clamped = Math.max(0, Math.min(count, safeThreshold));
  const pct = (clamped / safeThreshold) * 100;
  const ready = clamped >= safeThreshold;

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-pixel text-ink-dim text-[8px] tracking-wide uppercase">
          Pity
        </span>
        <span
          className={`text-base leading-none tabular-nums ${ready ? "text-gold" : "text-ink"}`}
        >
          {clamped}/{safeThreshold}
        </span>
      </div>
      <div
        className="border-edge bg-navy-deep h-2 w-full border-2"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={safeThreshold}
        aria-valuenow={clamped}
        aria-label="Pulls until a guaranteed epic or better"
      >
        <div
          className={`h-full ${ready ? "bg-gold" : "bg-mint"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-ink-dim text-base leading-tight">
        {ready
          ? "Next summon is a guaranteed Epic or better!"
          : `${safeThreshold - clamped} more summons until a guaranteed Epic+.`}
      </p>
    </div>
  );
}
