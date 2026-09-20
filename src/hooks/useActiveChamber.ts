"use client";

import { useEffect, useState } from "react";

/**
 * The chamber the doctor is currently operating in. It is chosen from the
 * sidebar workspace switcher ("Chambers" group) and persisted here. An empty
 * value means "Personal mode" — no chamber selected.
 */
export const ACTIVE_CHAMBER_STORAGE_KEY = "activeChamberId";

/** Emitted whenever the active chamber changes, so open pages can react. */
export const ACTIVE_CHAMBER_EVENT = "active-chamber-changed";

export const readActiveChamberId = (): string => {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(ACTIVE_CHAMBER_STORAGE_KEY) || "";
};

/** Persists the active chamber ("" clears it) and notifies listeners. */
export const persistActiveChamber = (id: string) => {
  if (typeof window === "undefined") return;
  if (id) {
    localStorage.setItem(ACTIVE_CHAMBER_STORAGE_KEY, id);
  } else {
    localStorage.removeItem(ACTIVE_CHAMBER_STORAGE_KEY);
  }
  window.dispatchEvent(new CustomEvent(ACTIVE_CHAMBER_EVENT, { detail: id }));
};

/** Subscribes to the active chamber ("" = Personal mode). */
export function useActiveChamber() {
  const [chamberId, setChamberId] = useState("");

  useEffect(() => {
    const read = () => setChamberId(readActiveChamberId());

    read();
    window.addEventListener(ACTIVE_CHAMBER_EVENT, read);
    // Keep multiple tabs in sync.
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener(ACTIVE_CHAMBER_EVENT, read);
      window.removeEventListener("storage", read);
    };
  }, []);

  return chamberId;
}
