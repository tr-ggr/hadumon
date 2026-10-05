import type { ReactNode } from "react";

import { Label } from "~/components/ui";

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

/** One row of single-choice filter tokens with an "All" token in front. */
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
      className="flex flex-wrap items-center gap-x-2 gap-y-2.5"
    >
      <Label className="w-full sm:w-14">{label}</Label>
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
      data-sfx="pick"
      className={`piece border-ink text-ink inline-flex min-h-11 items-center gap-1.5 border-2 px-3 text-sm font-bold ${
        pressed ? "bg-lime is-chosen" : "hover:bg-sky-soft bg-white"
      }`}
    >
      {children}
    </button>
  );
}
