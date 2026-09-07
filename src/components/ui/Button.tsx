import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";
type Variant = ButtonVariant;
type Size = ButtonSize;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const VARIANTS: Record<Variant, string> = {
  primary: "bg-gold text-navy border-navy hover:bg-[#ffd968]",
  secondary: "bg-panel-hi text-ink border-edge hover:bg-edge",
  ghost: "bg-transparent text-ink-dim border-edge hover:text-ink",
  danger: "bg-pink text-navy border-navy hover:bg-[#ff92c8]",
};

const SIZES: Record<Size, string> = {
  sm: "px-2 py-1 text-[10px]",
  md: "px-3 py-2 text-xs",
};

/**
 * The pixel button's full class list, for elements that must look like a
 * `Button` without being one (the landing page's account links are anchors).
 */
export function buttonClassName(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className = "",
): string {
  return `text-pixel pixel-press inline-flex items-center justify-center gap-2 border-2 shadow-[3px_3px_0_#000] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none ${VARIANTS[variant]} ${SIZES[size]} ${className}`;
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
