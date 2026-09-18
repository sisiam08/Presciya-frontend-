// src/components/ui/textarea.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[80px] w-full rounded-lg border border-gray-200 dark:border-slate-800 bg-surface-container-lowest p-3 text-sm text-on-surface placeholder:text-on-surface-variant/60",
      "focus-visible:outline-none focus:outline-none",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  />
));

Textarea.displayName = "Textarea";

export { Textarea };
