import type { ReactNode } from "react";

export interface FilterOption<T extends string> {
  value: T;
  label: string;
  /** Drawn before the label, e.g. an element's mark. */
  mark?: ReactNode;
}

export interface FilterChipsProps<T extends string> {
  /** Names the group, shown beside the chips. */
  label: string;
  options: readonly FilterOption<T>[];
  /** The chosen option, or `null` for "All". */
  value: T | null;
  onChange: (value: T | null) => void;
}

/** One row of single-choice filter chips with an "All" chip in front. */
export function FilterChips<T extends string>({
  label,
  options,
  value,
  onChange,
}: FilterChipsProps<T>) {
  return (
    <div
      role="group"
      aria-label={`Filter by ${label.toLowerCase()}`}
      className="flex flex-wrap items-center gap-1.5"
    >
      <span className="text-ink-soft w-full text-xs font-bold tracking-wide uppercase sm:w-16">
        {label}
      </span>
      <Chip pressed={value === null} onClick={() => onChange(null)}>
        All
      </Chip>
      {options.map((option) => (
        <Chip
          key={option.value}
          pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.mark}
          {option.label}
        </Chip>
      ))}
    </div>
  );
}

function Chip({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`pixel-press inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3 text-sm font-bold ${
        pressed
          ? "border-cobalt bg-cobalt text-white"
          : "border-ink/15 text-ink hover:bg-sky-soft bg-white"
      }`}
    >
      {children}
    </button>
  );
}
