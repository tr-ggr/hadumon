import type { ReactNode } from "react";

export interface StatProps {
  label: string;
  value: ReactNode;
  tone?: "default" | "gold" | "mint" | "pink" | "sky";
  className?: string;
}

const TONES = {
  default: "text-ink",
  gold: "text-gold",
  mint: "text-mint",
  pink: "text-pink",
  sky: "text-sky",
} as const;

export function Stat({ label, value, tone = "default", className = "" }: StatProps) {
  return (
    <div className={`flex items-baseline justify-between gap-2 ${className}`}>
      <span className="text-pixel text-[8px] tracking-wide text-ink-dim uppercase">
        {label}
      </span>
      <span className={`text-xl leading-none tabular-nums ${TONES[tone]}`}>{value}</span>
    </div>
  );
}
