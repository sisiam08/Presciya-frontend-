"use client";

import axios from "axios";



const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;


export const SESSION_HINT_KEY = "presciya.session";


const LEGACY_TOKEN_KEY = "accessToken";

export const markSessionPresent = (): void => {
  try {
    localStorage.setItem(SESSION_HINT_KEY, "1");
    
    localStorage.removeItem(LEGACY_TOKEN_KEY);
  } catch {
    
  }
};

export const clearSessionHint = (): void => {
  try {
    localStorage.removeItem(SESSION_HINT_KEY);
  } catch {
    
  }
};

export const hasSessionHint = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    if (localStorage.getItem(SESSION_HINT_KEY)) return true;
    
    
    if (localStorage.getItem(LEGACY_TOKEN_KEY)) {
      localStorage.removeItem(LEGACY_TOKEN_KEY);
      localStorage.setItem(SESSION_HINT_KEY, "1");
      return true;
    }
  } catch {
    
  }
  return false;
};


const AUTH_ENDPOINTS = [
  "/auth/login",
  "/auth/signup",
  "/auth/refresh-token",
  "/auth/logout",
  "/auth/logout-all",
  "/auth/forget-password",
  "/auth/reset-password",
  "/auth/sendOTP",
];

export const isAuthEndpoint = (url?: string): boolean =>
  !!url && AUTH_ENDPOINTS.some((path) => url.includes(path));


let refreshPromise: Promise<void> | null = null;


export const refreshSession = (): Promise<void> => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_BASE_URL}/auth/refresh-token`, null, {
        withCredentials: true,
      })
      .then(() => undefined)
      .catch((error) => {
        
        void endSession();
        throw error;
      })
      .finally(() => {
        
        
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

let endingSession = false;


const REDIRECT_GUARD_KEY = "presciya.session.endedAt";
const REDIRECT_GUARD_MS = 3000;

const canRedirectAgain = (): boolean => {
  try {
    const previous = Number(sessionStorage.getItem(REDIRECT_GUARD_KEY) || 0);
    const now = Date.now();
    sessionStorage.setItem(REDIRECT_GUARD_KEY, String(now));
    return now - previous > REDIRECT_GUARD_MS;
  } catch {
    return true;
  }
};


export const endSession = async (): Promise<void> => {
  if (endingSession) return;
  endingSession = true;

  clearSessionHint();

  if (typeof document !== "undefined") {
    
    
    
    document.cookie = "accessToken=; path=/; max-age=0";
  }

  try {
    
    await axios.post(`${API_BASE_URL}/auth/logout`, null, {
      withCredentials: true,
    });
  } catch {
    
  }

  if (typeof window !== "undefined") {
    const target = "/login";
    const alreadyThere = window.location.pathname.startsWith(target);
    if (!alreadyThere && canRedirectAgain()) {
      window.location.href = target;
    }
  }
};
