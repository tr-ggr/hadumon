import type { ReactNode } from "react";

export interface PanelProps {
  title?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
  bodyClassName?: string;
  tone?: "default" | "sky" | "featured";
}

export function Panel({
  title,
  action,
  children,
  className = "",
  bodyClassName = "",
  tone = "default",
}: PanelProps) {
  return (
    <section
      className={`panel ${tone === "sky" ? "bg-sky-soft" : ""} ${tone === "featured" ? "border-cobalt border-2" : ""} ${className}`}
    >
      {(title ?? action) ? (
        <header className="flex items-center justify-between gap-3 px-4 pt-4">
          {title ? (
            <h2 className="text-pixel text-ink text-lg sm:text-xl">{title}</h2>
          ) : (
            <span />
          )}
          {action}
        </header>
      ) : null}
      <div className={`p-4 ${bodyClassName}`}>{children}</div>
    </section>
  );
}
