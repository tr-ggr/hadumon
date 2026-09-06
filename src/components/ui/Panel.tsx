import type { ReactNode } from "react";

export interface PanelProps {
  title?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function Panel({
  title,
  action,
  children,
  className = "",
  bodyClassName = "",
}: PanelProps) {
  return (
    <section className={`panel ${className}`}>
      {(title ?? action) ? (
        <header className="flex items-center justify-between gap-2 border-b-2 border-edge bg-panel-hi px-3 py-2">
          {title ? (
            <h2 className="text-pixel text-[10px] text-gold sm:text-xs">{title}</h2>
          ) : (
            <span />
          )}
          {action}
        </header>
      ) : null}
      <div className={`p-3 ${bodyClassName}`}>{children}</div>
    </section>
  );
}
