"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * Dismisses a popover/dropdown when the user clicks outside `ref` or presses
 * Escape. Shared by the patient search/select components so the behaviour is
 * consistent everywhere instead of re-implemented per screen.
 *
 * Uses pointerdown (not blur) so a click INSIDE the container — e.g. a patient
 * suggestion — is ignored here and still reaches its own click handler.
 */
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
