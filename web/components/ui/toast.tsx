"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * 轻量 toast。全局 <ToastProvider> 放在 layout,通过 useToast() 触发。
 * 只做 4s 自动消失 + 手动关闭,不引入 radix / sonner。
 */

export type ToastVariant = "default" | "success" | "error";

export type ToastData = {
  id: number;
  title: string;
  description?: string;
  variant?: ToastVariant;
  action?: { label: string; href: string };
};

type ToastCtx = {
  toasts: ToastData[];
  push: (t: Omit<ToastData, "id">) => number;
  dismiss: (id: number) => void;
};

const Ctx = React.createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastData[]>([]);
  const idRef = React.useRef(0);

  const dismiss = React.useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = React.useCallback(
    (t: Omit<ToastData, "id">) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { ...t, id }]);
      setTimeout(() => dismiss(id), 5000);
      return id;
    },
    [dismiss],
  );

  return (
    <Ctx.Provider value={{ toasts, push, dismiss }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => dismiss(t.id)} />
        ))}
      </div>
    </Ctx.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: ToastData; onClose: () => void }) {
  const color =
    toast.variant === "success"
      ? "border-[var(--color-success)]/50"
      : toast.variant === "error"
        ? "border-[var(--color-destructive)]/60"
        : "border-[var(--color-border)]";

  return (
    <div
      role="status"
      className={cn(
        "pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border bg-[var(--color-card)] p-4 text-sm shadow-lg shadow-black/20 animate-in fade-in slide-in-from-bottom-2 duration-200",
        color,
      )}
    >
      <div className="flex-1">
        <div className="font-medium">{toast.title}</div>
        {toast.description && (
          <div className="mt-1 break-all text-[var(--color-muted-foreground)]">
            {toast.description}
          </div>
        )}
        {toast.action && (
          <a
            href={toast.action.href}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-[var(--color-primary)] hover:underline"
          >
            {toast.action.label} ↗
          </a>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
        aria-label="close"
      >
        ×
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
