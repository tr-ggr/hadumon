import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

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
      className={`text-pixel pixel-press inline-flex items-center justify-center gap-2 border-2 shadow-[3px_3px_0_#000] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    />
  );
}
