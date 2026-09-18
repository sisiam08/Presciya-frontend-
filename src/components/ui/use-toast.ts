"use client";
// src/components/ui/use-toast.ts
import { useState, useEffect } from "react";

export interface ToastProps {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
  duration?: number;
}

type Listener = (toasts: ToastProps[]) => void;
let memoryToasts: ToastProps[] = [];
let listeners: Listener[] = [];

const genId = () => Math.random().toString(36).substring(2, 9);

export function toast({ title, description, variant = "default", duration = 5000 }: Omit<ToastProps, "id">) {
  const id = genId();
  const newToast: ToastProps = { id, title, description, variant, duration };
  memoryToasts = [...memoryToasts, newToast];
  listeners.forEach((listener) => listener(memoryToasts));

  setTimeout(() => {
    dismiss(id);
  }, duration);

  return id;
}

export function dismiss(id: string) {
  memoryToasts = memoryToasts.filter((t) => t.id !== id);
  listeners.forEach((listener) => listener(memoryToasts));
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>(memoryToasts);

  useEffect(() => {
    listeners.push(setToasts);
    return () => {
      listeners = listeners.filter((l) => l !== setToasts);
    };
  }, []);

  return {
    toasts,
    toast,
    dismiss,
  };
}
