import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

/** Small caps-free label above a group of game pieces. */
export function Label({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={`text-ink-soft text-xs font-bold ${className}`}>{children}</p>
  );
}

const TABLE_BUTTON = {
  primary: "bg-cobalt hover:bg-cobalt-dark text-white",
  secondary: "bg-cream hover:bg-sky-soft text-ink",
  /** The one of a set that is in force: the page you are on, a filter set. */
  chosen: "bg-lime hover:bg-lime text-ink",
  /** Something is taken away for good. Ink, since coral is the rival's. */
  danger: "bg-ink hover:bg-ink/85 text-cream",
};
const TABLE_BUTTON_SIZE = {
  sm: "min-h-10 px-2.5 text-xs",
  md: "min-h-12 px-4 text-sm",
  lg: "min-h-14 px-6 text-base",
  /** A square that holds one pixel icon. */
  icon: "h-10 w-10 px-0",
};

export type TableButtonVariant = keyof typeof TABLE_BUTTON;
export type TableButtonSize = keyof typeof TABLE_BUTTON_SIZE;

/** The table action's dress, for a control that is not a `TableButton`. */
export function tableButtonClass(
  variant: TableButtonVariant,
  size: TableButtonSize,
  className = "",
): string {
  return `piece border-ink inline-flex items-center justify-center gap-1.5 border-2 text-center leading-tight font-black disabled:cursor-not-allowed disabled:opacity-45 ${TABLE_BUTTON[variant]} ${TABLE_BUTTON_SIZE[size]} ${className}`;
}

export interface TableButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Cobalt for the one confirm, cream for everything else. */
  variant?: TableButtonVariant;
  size?: TableButtonSize;
}

/**
 * An action on the table, cut from the same card as everything else: ink
 * outline, square corners, an edge that sinks when it is pressed. The cobalt
 * one is the way forward, and is heard as that (`sfx/ClickSound.tsx`).
 */
export function TableButton({
  variant = "primary",
  size = "sm",
  className = "",
  type = "button",
  ...props
}: TableButtonProps) {
  return (
    <button
      type={type}
      data-sfx={variant === "primary" ? "confirm" : undefined}
      className={tableButtonClass(variant, size, className)}
      {...props}
    />
  );
}

export interface TableLinkProps extends Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "href"
> {
  href: string;
  children: ReactNode;
  variant?: TableButtonVariant;
  size?: TableButtonSize;
}

/** A link to another page, dressed as a table action. */
export function TableLink({
  href,
  children,
  variant = "secondary",
  size = "md",
  className = "",
  ...props
}: TableLinkProps) {
  return (
    <Link
      href={href}
      data-sfx={variant === "primary" ? "confirm" : undefined}
      className={tableButtonClass(variant, size, className)}
      {...props}
    >
      {children}
    </Link>
  );
}

/** The key that does the same as the control it sits on. */
export function KeyHint({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <kbd
      aria-hidden
      className={`key-hint border-ink/60 text-ink h-4 min-w-4 place-items-center border bg-white px-0.5 font-sans text-[10px] leading-none font-bold ${className}`}
    >
      {children}
    </kbd>
  );
}
