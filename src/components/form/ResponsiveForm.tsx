"use client";

import React from "react";
import { motion } from "framer-motion";

interface ResponsiveFormProps {
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  columns?: number; // Desktop columns
}

export default function ResponsiveForm({
  children,
  onSubmit,
  columns = 2,
}: ResponsiveFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className={`grid grid-cols-1 md:grid-cols-${Math.min(columns, 2)} lg:grid-cols-${columns} gap-4`}
    >
      {children}
    </form>
  );
}

// Form Field Component
interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  span?: boolean; // Span full width
}

export function FormField({
  label,
  error,
  required,
  children,
  span = false,
}: FormFieldProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={span ? "col-span-full" : ""}
    >
      <label className="block text-sm font-medium text-on-surface-variant mb-1.5">
        {label}
        {required && <span className="text-error ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-error text-sm mt-1">{error}</p>}
    </motion.div>
  );
}

// Styled Input Component
interface StyledInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const StyledInput = React.forwardRef<HTMLInputElement, StyledInputProps>(
  ({ error, ...props }, ref) => (
    <input
      ref={ref}
      {...props}
      className={`w-full px-3 py-2 rounded-lg border transition-all focus:outline-none focus:ring-2 ${
        error
          ? "border-error focus:ring-error"
          : "border-outline-variant focus:ring-primary focus:border-primary"
      } bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant`}
    />
  ),
);

StyledInput.displayName = "StyledInput";

// Styled Textarea Component
interface StyledTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const StyledTextarea = React.forwardRef<
  HTMLTextAreaElement,
  StyledTextareaProps
>(({ error, ...props }, ref) => (
  <textarea
    ref={ref}
    {...props}
    className={`w-full px-3 py-2 rounded-lg border transition-all focus:outline-none focus:ring-2 resize-none ${
      error
        ? "border-error focus:ring-error"
        : "border-outline-variant focus:ring-primary focus:border-primary"
    } bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant`}
  />
));

StyledTextarea.displayName = "StyledTextarea";

// Styled Select Component
interface StyledSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  options: { value: string; label: string }[];
}

export function StyledSelect({ error, options, ...props }: StyledSelectProps) {
  return (
    <select
      {...props}
      className={`w-full px-3 py-2 rounded-lg border transition-all focus:outline-none focus:ring-2 ${
        error
          ? "border-error focus:ring-error"
          : "border-outline-variant focus:ring-primary focus:border-primary"
      } bg-surface-container-lowest text-on-surface`}
    >
      <option value="">Select...</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

// Form Actions Component
interface FormActionsProps {
  onCancel?: () => void;
  submitText?: string;
  cancelText?: string;
  loading?: boolean;
}

export function FormActions({
  onCancel,
  submitText = "Save",
  cancelText = "Cancel",
  loading = false,
}: FormActionsProps) {
  return (
    <div className="col-span-full flex gap-3 pt-4 border-t border-outline-variant">
      {onCancel && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-outline dark:border-outline-variant rounded-lg text-on-surface hover:bg-surface-container dark:hover:bg-surface-container-high transition-colors"
        >
          {cancelText}
        </motion.button>
      )}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type="submit"
        disabled={loading}
        className="flex-1 px-4 py-2 bg-primary hover:bg-primary-container text-on-primary rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        {loading ? "Saving..." : submitText}
      </motion.button>
    </div>
  );
}
