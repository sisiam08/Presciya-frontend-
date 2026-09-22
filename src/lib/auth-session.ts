"use client";

import axios from "axios";

/**
 * Single source of truth for client-side session recovery.
 *
 * The real session lives in cookies and is validated by the backend (the API
 * reads `req.cookies.accessToken` only — headers/localStorage are ignored).
 * Everything here exists purely to recover from an expired ACCESS token with a
 * still-valid REFRESH token, and to tear the session down cleanly when that is
 * no longer possible.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Non-secret marker that a session *might* exist. It never authorises anything
 * — it only tells the client whether it is worth asking the server. The server
 * session remains the single source of truth, so protected routes are still
 * enforced by the proxy and by the API itself.
 */
export const SESSION_HINT_KEY = "presciya.session";

/**
 * Older builds stored the raw access token in localStorage purely as an
 * "is logged in" flag. The value was never used for auth (the API reads the
 * session cookies) but it must not survive, so it is migrated to the hint and
 * removed on first read.
 */
const LEGACY_TOKEN_KEY = "accessToken";

export const markSessionPresent = (): void => {
  try {
    localStorage.setItem(SESSION_HINT_KEY, "1");
    // Never keep the legacy token marker around.
    localStorage.removeItem(LEGACY_TOKEN_KEY);
  } catch {
    /* storage unavailable (private mode) — the cookie still works */
  }
};

export const clearSessionHint = (): void => {
  try {
    localStorage.removeItem(SESSION_HINT_KEY);
  } catch {
    /* ignore */
  }
};

export const hasSessionHint = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    if (localStorage.getItem(SESSION_HINT_KEY)) return true;
    // One-time migration from the legacy build so already-signed-in users are
    // not treated as signed out after this change.
    if (localStorage.getItem(LEGACY_TOKEN_KEY)) {
      localStorage.removeItem(LEGACY_TOKEN_KEY);
      localStorage.setItem(SESSION_HINT_KEY, "1");
      return true;
    }
  } catch {
    /* storage unavailable — fall through to "no hint" */
  }
  return false;
};

/**
 * Endpoints that ARE the auth flow. A 401 from these must never trigger a
 * refresh (a wrong password is not an expired session), which also prevents a
 * failed login from looping through the refresh cycle.
 */
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

/**
 * A single in-flight refresh shared by every caller. The backend ROTATES the
 * refresh token on each call and treats a reused token as a security event
 * (revoking every session for the user), so concurrent refreshes would log the
 * user out. All callers therefore await the same request.
 */
let refreshPromise: Promise<void> | null = null;

/** Refresh the session exactly once, no matter how many callers ask. */
export const refreshSession = (): Promise<void> => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_BASE_URL}/auth/refresh-token`, null, {
        withCredentials: true,
      })
      .then(() => undefined)
      .catch((error) => {
        // Refresh is no longer possible — end the session exactly once.
        void endSession();
        throw error;
      })
      .finally(() => {
        // Let a LATER 401 start a fresh cycle (never a tight loop: the caller
        // only ever retries a request once).
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

let endingSession = false;

/**
 * Redirect-loop breaker. Each end-of-session redirect is recorded so a second
 * one within a couple of seconds is suppressed: if the proxy keeps re-admitting
 * the user (e.g. the logout request could not reach the API) we stop bouncing
 * between /login and /dashboard instead of looping forever.
 */
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

/**
 * Refresh token is expired/invalid/revoked (or refresh failed): clear the
 * server cookies and the client state, then send the user to login once.
 * Repeated calls are ignored so concurrent failures cause a single redirect.
 */
export const endSession = async (): Promise<void> => {
  if (endingSession) return;
  endingSession = true;

  clearSessionHint();

  if (typeof document !== "undefined") {
    // Clear the cookie JavaScript can see, so a stale token cannot keep the
    // proxy happy if the logout request below fails. (refreshToken is httpOnly
    // and can only be cleared by the server.)
    document.cookie = "accessToken=; path=/; max-age=0";
  }

  try {
    // Invalidates the session server-side and clears the httpOnly cookies.
    await axios.post(`${API_BASE_URL}/auth/logout`, null, {
      withCredentials: true,
    });
  } catch {
    // Best effort — the local state is cleared and the redirect still happens.
  }

  if (typeof window !== "undefined") {
    const target = "/login";
    const alreadyThere = window.location.pathname.startsWith(target);
    if (!alreadyThere && canRedirectAgain()) {
      window.location.href = target;
    }
  }
};
