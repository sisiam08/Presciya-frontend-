"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";

/**
 * Responsive shell for the dashboard area.
 *
 * The app previously rendered the 256px sidebar at EVERY width, so on phones
 * and small tablets it permanently squeezed the content (and there was no way
 * to reach the navigation without it). Rather than maintaining a second,
 * divergent mobile menu, this wraps the ONE real `Sidebar`:
 *
 *   ≥ md  → the sidebar is laid out statically, exactly as before.
 *   < md  → the sidebar becomes an overlay drawer opened from a compact top bar.
 *
 * The drawer closes on navigation, on the scrim, and on Escape, so it can never
 * trap the user.
 */
export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [navOpen, setNavOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer after any navigation.
  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  // Close on Escape.
  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navOpen]);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 print:block print:min-h-0 print:bg-white">
      {/* Compact top bar — mobile/tablet only. */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-outline-variant bg-surface-container-lowest px-4 md:hidden print:hidden">
        <span className="text-base font-bold tracking-tight text-primary">
          Presciya
        </span>
        <button
          type="button"
          onClick={() => setNavOpen(true)}
          aria-label="Open navigation"
          aria-expanded={navOpen}
          className="rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* The single Sidebar: static from md up, overlay drawer below md. */}
      <div
        className={
          navOpen
            ? "fixed inset-y-0 left-0 z-50 block w-64"
            : "hidden w-64 shrink-0 md:block"
        }
      >
        <Sidebar />
      </div>

      {navOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setNavOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
        />
      )}

      {/* `pt-16` clears the fixed mobile top bar; unchanged from md up. */}
      <main className="flex-1 min-w-0 overflow-y-auto bg-slate-50 p-4 pt-16 dark:bg-slate-950 md:p-6 md:pt-6 lg:p-8 print:overflow-visible print:p-0 print:bg-white">
        {children}
      </main>
    </div>
  );
}
