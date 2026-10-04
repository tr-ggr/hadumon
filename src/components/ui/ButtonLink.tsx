import Link from "next/link";
import type { ReactNode } from "react";

import { buttonClassName, type ButtonSize, type ButtonVariant } from "./Button";

export interface ButtonLinkProps {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
}

/**
 * A navigation link that looks like a `Button` but is a real anchor, so a
 * keyboard user gets one focus stop that actually navigates.
 */
export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className = "",
  children,
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={buttonClassName(variant, size, `text-center ${className}`)}
    >
      {children}
    </Link>
  );
}
