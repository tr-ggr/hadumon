import type { ReactNode } from "react";

export interface BoardProps {
  /** Printed across the top of the board, as its heading. */
  title?: ReactNode;
  /** Sits at the right of the title: a count, or one small control. */
  action?: ReactNode;
  children?: ReactNode;
  id?: string;
  className?: string;
  bodyClassName?: string;
}

/**
 * A cream board laid on the cloth: the page-sized piece that everything else
 * is set out on. It has a card's edge and cast, but it is not a `piece`, so
 * the buttons and cards on it keep their own.
 */
export function Board({
  title,
  action,
  children,
  id,
  className = "",
  bodyClassName = "",
}: BoardProps) {
  return (
    <section id={id} className={`board text-ink ${className}`}>
      {(title ?? action) ? (
        <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1 px-4 pt-4 sm:px-5">
          {title ? <h2 className="text-print text-3xl">{title}</h2> : <span />}
          {action}
        </header>
      ) : null}
      <div className={`p-4 sm:p-5 ${bodyClassName}`}>{children}</div>
    </section>
  );
}
