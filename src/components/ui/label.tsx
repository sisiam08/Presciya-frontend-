// src/components/ui/label.tsx
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5 select-none",
        className
      )}
      {...props}
    />
  )
);
Label.displayName = "Label";

export { Label };
