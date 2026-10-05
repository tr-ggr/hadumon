import type { InputHTMLAttributes, ReactNode } from "react";

export interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /** A control that sits inside the field's right end, such as Show. */
  trailing?: ReactNode;
}

/**
 * A place to write on the table: a white slot cut into the board, with its
 * label printed above it.
 */
export function Field({
  label,
  trailing,
  className = "",
  ...props
}: FieldProps) {
  return (
    <label className="block">
      <span className="text-ink mb-1.5 block text-sm font-extrabold">
        {label}
      </span>
      <span className="relative block">
        <input
          className={`field text-ink min-h-12 w-full px-3 text-base disabled:opacity-60 ${trailing ? "pr-20" : ""} ${className}`}
          {...props}
        />
        {trailing ? (
          <span className="absolute inset-y-0 right-1.5 flex items-center">
            {trailing}
          </span>
        ) : null}
      </span>
    </label>
  );
}
