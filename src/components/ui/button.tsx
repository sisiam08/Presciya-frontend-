// src/components/ui/button.tsx
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'default', ...props }, ref) => {
    const base = "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 cursor-pointer disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] select-none";

    const variants = {
      // `hover:text-on-primary-container` is required: in dark mode
      // `primary-container` is a DARK blue while `on-primary` is also dark, so
      // without it the label becomes unreadable on hover.
      primary:   "bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container shadow-sm",
      secondary: "bg-secondary text-on-secondary hover:opacity-90 shadow-sm",
      outline:   "border border-outline dark:border-outline-variant bg-transparent text-on-surface hover:bg-surface-container dark:hover:bg-surface-container-high",
      ghost:     "bg-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container dark:hover:bg-surface-container-high",
      danger:    "bg-error text-on-error hover:opacity-90 shadow-sm",
      link:      "bg-transparent text-primary underline-offset-4 hover:underline p-0 h-auto",
    };

    const sizes = {
      default: "h-10 px-4 py-2 text-sm",
      sm:      "h-8 px-3 text-xs rounded-md",
      lg:      "h-12 px-8 text-base rounded-xl",
      icon:    "h-9 w-9",
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
