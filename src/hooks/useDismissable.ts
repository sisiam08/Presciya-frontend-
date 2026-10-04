"use client";

import { useEffect, useRef, type RefObject } from "react";


export function useDismissable(
  ref: RefObject<HTMLElement | null>,
  onDismiss: () => void,
  enabled = true,
) {
  const saved = useRef(onDismiss);

  useEffect(() => {
    saved.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (!enabled) return;

    const handleOutside = (event: Event) => {
      const target = event.target as Node | null;
      if (ref.current && target && ref.current.contains(target)) return;
      saved.current();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") saved.current();
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [ref, enabled]);
}
