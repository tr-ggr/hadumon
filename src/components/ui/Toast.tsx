"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ToastTone = "ok" | "error";

export type Notify = (text: string, tone?: ToastTone) => void;

interface ToastItem {
  id: number;
  text: string;
  tone: ToastTone;
}

/** How long a toast stays on screen. */
const TOAST_MS = 4000;

/** How near the bottom of the window a piece has to end to count as docked. */
const DOCKED_PX = 24;
/** The most of the window's height a dock may lift the stack by. */
const CLEAR_MOST = 0.7;

const ToastContext = createContext<Notify | null>(null);

/**
 * How much of the foot of the window is taken by whatever asks to be kept
 * clear of notices (`data-toast-clear`: a table's rail, the hand, a choice
 * laid over a scene), in the window's own pixels. 0 when nothing does.
 */
function dockedHeight(): number {
  const height = window.innerHeight;
  let top = height;
  for (const el of document.querySelectorAll("[data-toast-clear]")) {
    const rect = el.getBoundingClientRect();
    if (rect.height <= 0 || rect.bottom < height - DOCKED_PX) continue;
    top = Math.min(top, rect.top);
  }
  return Math.min(height - Math.max(0, top), height * CLEAR_MOST);
}

/**
 * App-wide ephemeral notice stack, pinned above the phone's nav dock and
 * above anything a screen has docked to its own foot, so a notice never
 * lands on the control it is about.
 *
 * Mounted once in the root layout, so every page reports mutation errors and
 * successes the same way.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const stack = useRef<HTMLDivElement>(null);
  const showing = toasts.length > 0;

  // What is docked is measured as a notice lands and while one is up: a
  // dock grows and shrinks with what it holds.
  useLayoutEffect(() => {
    const el = stack.current;
    if (!el || !showing) return;
    const clear = () =>
      el.style.setProperty("--toast-clear", `${dockedHeight()}px`);
    clear();
    window.addEventListener("resize", clear);
    return () => window.removeEventListener("resize", clear);
  }, [showing, toasts]);

  const notify = useCallback<Notify>((text, tone = "ok") => {
    setToasts((current) => [
      ...current.slice(-2),
      { id: Date.now() + Math.random(), text, tone },
    ]);
  }, []);

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div
        ref={stack}
        className="toast-stack pointer-events-none fixed inset-x-0 z-50 flex flex-col items-center gap-3 px-3"
      >
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            toast={toast}
            onDone={() =>
              setToasts((current) => current.filter((t) => t.id !== toast.id))
            }
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** Returns `notify(text, tone)`. Safe to call outside a provider (no-op). */
export function useToast(): Notify {
  const notify = useContext(ToastContext);
  return notify ?? noop;
}

function noop(): void {
  // No provider mounted (e.g. an isolated test render) — drop the notice.
}

function Toast({ toast, onDone }: { toast: ToastItem; onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, TOAST_MS);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <output
      aria-live="polite"
      className={`piece border-ink anim-land pointer-events-auto flex max-w-sm items-center gap-3 border-2 px-3 py-2 text-sm font-semibold ${
        toast.tone === "error" ? "bg-ink text-cream" : "text-ink bg-white"
      }`}
    >
      <span className="leading-tight">{toast.text}</span>
      <button
        type="button"
        onClick={onDone}
        className="shrink-0 text-xs font-black underline underline-offset-2"
      >
        Ok
      </button>
    </output>
  );
}
