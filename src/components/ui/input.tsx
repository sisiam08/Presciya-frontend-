// src/components/ui/input.tsx
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-lg border border-gray-200 dark:border-slate-800",
        "bg-surface-container-lowest dark:bg-surface-container",
        "text-on-surface dark:text-on-surface placeholder:text-on-surface-variant/60",
        "px-3 py-2 text-sm",
        "transition-all duration-150",
        "focus-visible:outline-none focus:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
