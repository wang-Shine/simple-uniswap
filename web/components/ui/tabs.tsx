"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * 极简 tabs。不引入 radix,受控/非受控都行。
 *   <Tabs value={v} onValueChange={setV}>
 *     <TabsList><TabsTrigger value="a">A</TabsTrigger></TabsList>
 *     <TabsContent value="a">...</TabsContent>
 *   </Tabs>
 */
type TabsCtx = {
  value: string;
  setValue: (v: string) => void;
};

const Ctx = React.createContext<TabsCtx | null>(null);

function useTabs() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("Tabs child used outside <Tabs>");
  return ctx;
}

export function Tabs({
  value,
  defaultValue,
  onValueChange,
  className,
  children,
}: {
  value?: string;
  defaultValue?: string;
  onValueChange?: (v: string) => void;
  className?: string;
  children: React.ReactNode;
}) {
  const [inner, setInner] = React.useState(defaultValue ?? "");
  const isControlled = value !== undefined;
  const current = isControlled ? value : inner;
  const setValue = React.useCallback(
    (v: string) => {
      if (!isControlled) setInner(v);
      onValueChange?.(v);
    },
    [isControlled, onValueChange],
  );

  return (
    <Ctx.Provider value={{ value: current, setValue }}>
      <div className={className}>{children}</div>
    </Ctx.Provider>
  );
}

export function TabsList({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-xl bg-[var(--color-muted)] p-1 text-[var(--color-muted-foreground)]",
        className,
      )}
      role="tablist"
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  className,
  children,
}: {
  value: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { value: current, setValue } = useTabs();
  const active = current === value;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      data-state={active ? "active" : "inactive"}
      onClick={() => setValue(value)}
      className={cn(
        "inline-flex min-w-24 cursor-pointer items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]",
        active
          ? "bg-[var(--color-card)] text-[var(--color-foreground)] shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset]"
          : "hover:text-[var(--color-foreground)]",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  className,
  children,
}: {
  value: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { value: current } = useTabs();
  if (current !== value) return null;
  return (
    <div className={cn("mt-4", className)} role="tabpanel">
      {children}
    </div>
  );
}
