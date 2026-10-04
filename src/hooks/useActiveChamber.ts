"use client";

import { useEffect, useState } from "react";


export const ACTIVE_CHAMBER_STORAGE_KEY = "activeChamberId";


export const ACTIVE_CHAMBER_EVENT = "active-chamber-changed";

export const readActiveChamberId = (): string => {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(ACTIVE_CHAMBER_STORAGE_KEY) || "";
};


export const persistActiveChamber = (id: string) => {
  if (typeof window === "undefined") return;
  if (id) {
    localStorage.setItem(ACTIVE_CHAMBER_STORAGE_KEY, id);
  } else {
    localStorage.removeItem(ACTIVE_CHAMBER_STORAGE_KEY);
  }
  window.dispatchEvent(new CustomEvent(ACTIVE_CHAMBER_EVENT, { detail: id }));
};


export function useActiveChamber() {
  const [chamberId, setChamberId] = useState("");

  useEffect(() => {
    const read = () => setChamberId(readActiveChamberId());

    read();
    window.addEventListener(ACTIVE_CHAMBER_EVENT, read);
    
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener(ACTIVE_CHAMBER_EVENT, read);
      window.removeEventListener("storage", read);
    };
  }, []);

  return chamberId;
}
