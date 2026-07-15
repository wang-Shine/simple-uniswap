"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * shadcn 风格 Button。
 * 交互态全部用 tailwind class 完成,不引入额外动画库。
 */
const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium " +
    "transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] " +
    "disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-px",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary)]/90 shadow-[0_1px_0_0_rgba(255,255,255,0.08)_inset]",
        secondary:
          "bg-[var(--color-surface)] text-[var(--color-foreground)] hover:bg-[var(--color-accent)]",
        outline:
          "border border-[var(--color-border)] bg-transparent hover:bg-[var(--color-surface)] hover:text-[var(--color-foreground)]",
        ghost: "hover:bg-[var(--color-surface)] hover:text-[var(--color-foreground)]",
        destructive:
          "bg-[var(--color-destructive)] text-[var(--color-destructive-foreground)] hover:bg-[var(--color-destructive)]/90",
        link: "text-[var(--color-primary)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
