"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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

const ToastContext = createContext<Notify | null>(null);

/**
 * App-wide ephemeral notice stack, pinned above the mobile bottom nav.
 *
 * Mounted once in the root layout, so every page reports mutation errors and
 * successes the same way.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const notify = useCallback<Notify>((text, tone = "ok") => {
    setToasts((current) => [
      ...current.slice(-2),
      { id: Date.now() + Math.random(), text, tone },
    ]);
  }, []);

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-16 z-50 flex flex-col items-center gap-2 px-3 md:bottom-4">
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
      className={`panel-flat pointer-events-auto flex max-w-sm items-center gap-3 px-3 py-2 text-base shadow-[0_12px_24px_rgb(23_33_43_/_0.14)] ${
        toast.tone === "error"
          ? "border-pink text-pink"
          : "border-mint text-mint"
      }`}
    >
      <span className="leading-tight">{toast.text}</span>
      <button
        type="button"
        onClick={onDone}
        className="text-pixel shrink-0 text-[8px] uppercase underline"
      >
        Ok
      </button>
    </output>
  );
}
