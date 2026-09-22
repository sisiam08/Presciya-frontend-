// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formatting utilities
export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString("en-BD", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const formatDateTime = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString("en-BD", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatTime = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleTimeString("en-BD", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Number formatting — centralised so currency can change in one place later.
export const formatCurrency = (amount: number | string): string => {
  const value = typeof amount === "string" ? Number(amount) : amount;
  if (!Number.isFinite(value)) return "৳0";
  return `৳${new Intl.NumberFormat("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)}`;
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat("en-BD").format(num);
};

// Validation utilities
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Bangladesh mobile rules — the single frontend source of truth, mirroring
 * `backend/src/utils/phone.ts`. Canonical form: 01[3-9]XXXXXXXX (11 digits);
 * +8801… and light formatting are accepted and normalised before storage.
 */
export const BD_MOBILE_REGEX = /^01[3-9]\d{8}$/;

const BD_MOBILE_INPUT_REGEX = /^(?:\+?88)?01[3-9][\d\s\-().]*$/;

/** Strips separators and the +88 / 88 country prefix. */
export const normalizeBangladeshPhone = (value: string): string =>
  String(value ?? "")
    .replace(/[\s\-().]/g, "")
    .replace(/^\+?88/, "");

/** True when the value is a valid Bangladesh mobile number. */
export const isValidBangladeshPhone = (value: string): boolean => {
  const raw = String(value ?? "").trim();
  if (!raw) return false;
  return (
    BD_MOBILE_INPUT_REGEX.test(raw) &&
    BD_MOBILE_REGEX.test(normalizeBangladeshPhone(raw))
  );
};

export const BD_PHONE_MESSAGE =
  "Enter a valid Bangladesh mobile number (e.g. 01712345678).";

/** Backwards-compatible alias used by older call sites. */
export const isValidPhone = isValidBangladeshPhone;

// String utilities
export const truncate = (str: string, length: number): string => {
  return str.length > length ? str.substring(0, length) + "..." : str;
};

export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const toTitleCase = (str: string): string => {
  return str
    .split(" ")
    .map((word) => capitalize(word))
    .join(" ");
};

// Object utilities
export const omit = <T extends Record<string, any>>(
  obj: T,
  ...keys: (keyof T)[]
): Partial<T> => {
  const result = { ...obj };
  keys.forEach((key) => delete result[key]);
  return result;
};

export const pick = <T extends Record<string, any>>(
  obj: T,
  ...keys: (keyof T)[]
): Partial<T> => {
  const result: Partial<T> = {};
  keys.forEach((key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
};

// Debounce utility
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
};

// Throttle utility
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number,
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Storage utilities
export const storage = {
  get: (key: string) => {
    try {
      if (typeof window === "undefined") return null;
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },

  set: (key: string, value: any) => {
    try {
      if (typeof window === "undefined") return;
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      console.error("Storage error:", key);
    }
  },

  remove: (key: string) => {
    try {
      if (typeof window === "undefined") return;
      window.localStorage.removeItem(key);
    } catch {
      console.error("Storage error:", key);
    }
  },

  clear: () => {
    try {
      if (typeof window === "undefined") return;
      window.localStorage.clear();
    } catch {
      console.error("Storage clear error");
    }
  },
};

// Error handling
export const getErrorMessage = (error: any): string => {
  if (typeof error === "string") return error;
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.message) return error.message;
  return "An error occurred";
};

// Generate unique ID
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
