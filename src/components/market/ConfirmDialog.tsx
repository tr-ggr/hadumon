"use client";

import { useEffect, type ReactNode } from "react";

import { Button } from "~/components/ui";

export interface ConfirmDialogProps {
  title: string;
  children: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmDisabled?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Hard-edged modal used for irreversible market actions (buy, cancel, trade). */
export function ConfirmDialog({
  title,
  children,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmDisabled = false,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 p-3 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="panel max-h-[90dvh] w-full max-w-sm animate-none overflow-y-auto"
      >
        <header className="border-edge bg-panel-hi border-b-2 px-3 py-2">
          <h2 className="text-pixel text-gold text-[10px]">{title}</h2>
        </header>
        <div className="space-y-3 p-3">
          {children}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={onCancel} disabled={busy}>
              {cancelLabel}
            </Button>
            <Button onClick={onConfirm} disabled={busy || confirmDisabled}>
              {busy ? "…" : confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
