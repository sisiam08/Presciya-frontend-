"use client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { useForm as useTanStackForm } from "@tanstack/react-form";
import { ZodSchema } from "zod";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface UseFormOptions<T extends Record<string, any>> {
  initialValues: T;
  schema: ZodSchema;
  onSubmit: (data: T) => Promise<void> | void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useForm<T extends Record<string, any>>(
  options: UseFormOptions<T>,
): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = (useTanStackForm as any)({
    defaultValues: options.initialValues,
    onSubmit: async ({ value }: any) => {
      await options.onSubmit(value);
    },
    validators: {
      onChange: ({ value }: any) => {
        try {
          options.schema.parse(value);
          return undefined;
        } catch (error: any) {
          return error.message;
        }
      },
    },
  });

  return form;
}

// Helper to get field props
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getFieldProps(field: any): any {
  return {
    value: field.state.value,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onChange: (e: any) => {
      const value = e.target?.value ?? e;
      field.handleChange(value);
    },
    onBlur: field.handleBlur,
    error: field.state.meta.errors[0] as string | undefined,
    isTouched: field.state.meta.isTouched,
  };
}

// Hook for form field registration
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useFormField<T extends Record<string, any>>(
  form: any,
  name: keyof T,
): any {
  return form.Field({
    name: name as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    children: (field: any) => ({ field, ...getFieldProps(field) }),
  });
}
