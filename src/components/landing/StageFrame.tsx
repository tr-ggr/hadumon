import type { ReactNode } from "react";

/**
 * The thick cobalt frame of the landing page: the hero's stage and the three
 * panels' pictures. Cats handed in as `crowd` are placed against the frame's
 * own box, so they keep their place at every width.
 */
export function StageFrame({
  children,
  crowd,
  className = "",
  innerClassName = "cloth",
}: {
  children: ReactNode;
  /** Cats standing on, behind or beside the frame. */
  crowd?: ReactNode;
  className?: string;
  /** The ground inside the frame; the cloth unless told otherwise. */
  innerClassName?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      {crowd}
      <div className="stage z-10 h-full">
        <span aria-hidden className="stud top-0.5 left-0.5" />
        <span aria-hidden className="stud top-0.5 right-0.5" />
        <span aria-hidden className="stud bottom-0.5 left-0.5" />
        <span aria-hidden className="stud right-0.5 bottom-0.5" />
        <div className={`stage-inner ${innerClassName}`}>{children}</div>
      </div>
    </div>
  );
}
