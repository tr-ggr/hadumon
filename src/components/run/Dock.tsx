import type { ReactNode } from "react";

/**
 * The bar that keeps the current decision and its confirm within reach. It
 * sticks to the bottom of the viewport, above the mobile nav, for as long as
 * the screen it closes is in view.
 */
export function Dock({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`panel-flat border-ink/15 sticky bottom-[5.5rem] z-20 flex flex-col gap-2 p-3 shadow-[0_10px_30px_rgb(23_33_43_/_0.16)] md:bottom-3 ${className}`}
    >
      {children}
    </div>
  );
}
