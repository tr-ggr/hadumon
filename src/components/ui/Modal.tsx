"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { prefersCalm } from "~/components/run/fx/dom";
import { popTransform } from "./pop";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** Names the dialog; rendered as its heading. */
  title: string;
  children?: ReactNode;
  /** Action row, e.g. Cancel and Confirm buttons. */
  footer?: ReactNode;
  className?: string;
  /** 448px across, or 720px for a spread of cards. */
  size?: "md" | "wide";
  /**
   * Where the dialog comes up from and goes back to, on the screen: the
   * pocket a card was taken out of. Measured as it opens and again as it
   * closes. Inside the dialog, `[data-pop-anchor]` marks what was taken from
   * there; with none, it is the whole dialog. Without an origin the dialog
   * is simply there and simply gone.
   */
  origin?: () => DOMRect | null;
  /** Told once the dialog is gone, after it has gone back where it came from. */
  onClosed?: () => void;
}

const FOCUSABLE =
  'a[href], button:not([disabled]):not([tabindex="-1"]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const POP_IN_MS = 300;
const POP_OUT_MS = 220;
/** The tabletop's own curves, should the stylesheet's not be readable. */
const EASE_GIVE = "cubic-bezier(0.2, 0.9, 0.3, 1.25)";
const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";

/** A curve the stylesheet names; the Web Animations API takes no `var()`. */
function curve(el: HTMLElement, name: string, fallback: string): string {
  return getComputedStyle(el).getPropertyValue(name).trim() || fallback;
}

/**
 * The panel held over `from`, then at rest. Measured with the panel at rest,
 * so whatever was moving it has to be cancelled first. The panel is what
 * moves, not the card in it: the panel scrolls, and would clip a card that
 * left it.
 */
function popFrames(panel: HTMLElement, from: DOMRect): Keyframe[] {
  const anchor = panel.querySelector<HTMLElement>("[data-pop-anchor]") ?? panel;
  const held = popTransform(
    from,
    panel.getBoundingClientRect(),
    anchor.getBoundingClientRect(),
  );
  return [
    { transform: held, transformOrigin: "0 0" },
    { transform: "translate(0px, 0px) scale(1)", transformOrigin: "0 0" },
  ];
}

/**
 * The app's one dialog: a board held over the table. Closes on Escape and on
 * a backdrop click, keeps Tab inside while it is open, and hands focus back
 * to whatever opened it.
 *
 * Focus starts on the first `[data-autofocus]` element, or on the dialog
 * itself when there is none. Portalled to `<body>` so a blurred or transformed
 * ancestor cannot clip the backdrop.
 *
 * Given an `origin`, it comes up from there and goes back to it, and stays
 * mounted, taking no input, until it is back. Reduced motion skips both.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  className = "",
  size = "md",
  origin,
  onClosed,
}: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  // Keeps the latest `onClose` without re-running the focus effect.
  const onCloseRef = useRef(onClose);
  const originRef = useRef(origin);
  const onClosedRef = useRef(onClosed);
  const [mounted, setMounted] = useState(false);
  /** Closed, and on its way back to where it came from. */
  const [leaving, setLeaving] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    setLeaving(!open && mounted && origin !== undefined && !prefersCalm());
  }

  useLayoutEffect(() => {
    onCloseRef.current = onClose;
    originRef.current = origin;
    onClosedRef.current = onClosed;
  });

  useEffect(() => setMounted(true), []);

  // Up from where it came. Measured before the focus effect below stops the
  // page scrolling, which can move the page under the dialog.
  useLayoutEffect(() => {
    if (!open || !mounted) return;
    const panel = panelRef.current;
    const from = originRef.current?.();
    if (!panel || !from || prefersCalm()) return;
    const flight = panel.animate(popFrames(panel, from), {
      duration: POP_IN_MS,
      easing: curve(panel, "--ease-give", EASE_GIVE),
    });
    return () => flight.cancel();
  }, [open, mounted]);

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

  // And back. This runs after the effect above has let the page scroll
  // again, so the place it goes back to is measured where it now is.
  useEffect(() => {
    if (!leaving) return;
    const panel = panelRef.current;
    const from = originRef.current?.();
    if (!panel || !from) {
      setLeaving(false);
      return;
    }
    let cancelled = false;
    const flight = panel.animate(popFrames(panel, from).reverse(), {
      duration: POP_OUT_MS,
      easing: curve(panel, "--ease-out", EASE_OUT),
      fill: "forwards",
    });
    flight.finished.then(
      () => {
        if (!cancelled) setLeaving(false);
      },
      () => undefined,
    );
    return () => {
      cancelled = true;
      flight.cancel();
    };
  }, [leaving]);

  // Gone: said once for each time it was open, whichever way it left.
  const reported = useRef(true);
  useEffect(() => {
    if (open) {
      reported.current = false;
      return;
    }
    if (leaving || reported.current) return;
    reported.current = true;
    onClosedRef.current?.();
  }, [open, leaving]);

  if (!mounted || !(open || leaving)) return null;

  const closeOnBackdrop = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  return createPortal(
    <div
      className="bg-ink/50 fixed inset-0 z-50 flex items-end justify-center p-3 pb-5 sm:items-center sm:p-6"
      onMouseDown={closeOnBackdrop}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        inert={leaving}
        className={`board dialog-board text-ink max-h-[calc(100dvh-2rem)] w-full ${size === "wide" ? "max-w-[720px]" : "max-w-md"} overflow-y-auto p-4 outline-none sm:p-5 ${className}`}
      >
        <h2 id={titleId} className="text-print text-3xl">
          {title}
        </h2>
        {children ? <div className="mt-3">{children}</div> : null}
        {footer ? (
          <div className="mt-5 flex flex-col-reverse gap-3 pb-1 sm:flex-row sm:justify-end">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
