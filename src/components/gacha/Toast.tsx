"use client";

import { useEffect } from "react";

export interface ToastProps {
  message: string;
  tone?: "error" | "success";
  /** Auto-dismiss delay in ms; `0` disables it. */
  duration?: number;
  onDismiss: () => void;
}

const TONES = {
  error: "border-pink bg-panel text-pink",
  success: "border-mint bg-panel text-mint",
} as const;

/** Fixed banner that clears the mobile bottom nav. */
export function Toast({
  message,
  tone = "error",
  duration = 4000,
  onDismiss,
}: ToastProps) {
  useEffect(() => {
    if (duration <= 0) return;
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [duration, message, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-16 z-30 flex justify-center px-3 md:bottom-4"
    >
      <div
        className={`pointer-events-auto flex max-w-md items-center gap-3 border-2 px-3 py-2 shadow-[4px_4px_0_#000] ${TONES[tone]}`}
      >
        <span className="text-lg leading-tight">{message}</span>
        <button
          type="button"
          onClick={onDismiss}
          className="text-pixel shrink-0 text-[8px] uppercase underline"
        >
          Ok
        </button>
      </div>
    </div>
  );
}
