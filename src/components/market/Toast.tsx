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

interface ToastItem {
  id: number;
  text: string;
  tone: ToastTone;
}

type Notify = (text: string, tone?: ToastTone) => void;

const ToastContext = createContext<Notify>(() => undefined);

/** Small ephemeral notice stack pinned above the mobile nav bar. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const notify = useCallback<Notify>((text, tone = "ok") => {
    setToasts((current) => [
      ...current,
      { id: Date.now() + Math.random(), text, tone },
    ]);
  }, []);

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-16 z-30 flex flex-col items-center gap-2 px-3 md:bottom-4">
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

export function useToast(): Notify {
  return useContext(ToastContext);
}

function Toast({ toast, onDone }: { toast: ToastItem; onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 4000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <output
      className={`panel-flat pointer-events-auto max-w-sm px-3 py-2 text-base ${
        toast.tone === "error"
          ? "border-pink text-pink"
          : "border-mint text-mint"
      }`}
    >
      {toast.text}
    </output>
  );
}
