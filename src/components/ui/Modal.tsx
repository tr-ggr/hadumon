"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** Names the dialog; rendered as its heading. */
  title: string;
  children?: ReactNode;
  /** Action row, e.g. Cancel and Confirm buttons. */
  footer?: ReactNode;
  className?: string;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * The app's one dialog. Closes on Escape and on a backdrop click, keeps Tab
 * inside while it is open, and hands focus back to whatever opened it.
 *
 * Focus starts on the first `[data-autofocus]` element, or on the dialog
 * itself when there is none. Portalled to `<body>` so a blurred or transformed
 * ancestor cannot clip the backdrop.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  className = "",
}: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  // Keeps the latest `onClose` without re-running the focus effect.
  const onCloseRef = useRef(onClose);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open || !mounted) return;
    const panel = panelRef.current;
    if (!panel) return;

    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    (panel.querySelector<HTMLElement>("[data-autofocus]") ?? panel).focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) {
        event.preventDefault();
        panel.focus();
        return;
      }

      const active = document.activeElement;
      const outside = !panel.contains(active) || active === panel;
      if (event.shiftKey && (active === first || outside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || outside)) {
        event.preventDefault();
        first.focus();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      opener?.focus();
    };
  }, [open, mounted]);

  if (!open || !mounted) return null;

  const closeOnBackdrop = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  return createPortal(
    <div
      className="bg-ink/40 fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-6"
      onMouseDown={closeOnBackdrop}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`panel max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto p-5 outline-none sm:p-6 ${className}`}
      >
        <h2 id={titleId} className="text-pixel text-ink text-xl sm:text-2xl">
          {title}
        </h2>
        {children ? <div className="text-ink-soft mt-3">{children}</div> : null}
        {footer ? (
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
