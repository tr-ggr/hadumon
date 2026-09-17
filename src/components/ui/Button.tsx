import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant =
  "primary" | "secondary" | "ghost" | "danger" | "hero";
export type ButtonSize = "sm" | "md" | "lg";
type Variant = ButtonVariant;
type Size = ButtonSize;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-cobalt text-white border-cobalt hover:bg-cobalt-dark rounded-full",
  secondary:
    "bg-sky-soft text-ink border-transparent hover:bg-sky-surface rounded-full",
  ghost:
    "bg-transparent text-ink-soft border-transparent hover:bg-sky-soft rounded-full",
  danger: "bg-coral text-white border-coral hover:brightness-95 rounded-full",
  hero: "bg-lime text-ink border-lime hover:brightness-95 rounded-full shadow-[0_10px_20px_rgb(216_255_79_/_0.24)]",
};

const SIZES: Record<Size, string> = {
  sm: "min-h-10 px-3 py-2 text-xs",
  md: "min-h-12 px-5 py-3 text-sm",
  lg: "min-h-14 px-7 py-4 text-base",
};

/**
 * The button's full class list, for elements that must look like a
 * `Button` without being one (the landing page's account links are anchors).
 */
export function buttonClassName(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className = "",
): string {
  return `text-pixel pixel-press inline-flex items-center justify-center gap-2 border font-semibold disabled:cursor-not-allowed disabled:opacity-45 ${VARIANTS[variant]} ${SIZES[size]} ${className}`;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClassName(variant, size, className)}
      {...props}
    />
  );
}
