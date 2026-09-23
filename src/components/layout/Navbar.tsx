"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";

export default function Navbar() {
  const { resolvedTheme, setTheme } = useTheme();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 shadow-xs h-20 flex items-center transition-colors duration-300">
      <div className="flex justify-between items-center w-full px-4 md:px-8 max-w-7xl mx-auto">
        {/* Logo */}
        <Link href="/" className="text-2xl font-black text-primary dark:text-blue-400 tracking-tighter hover:opacity-90 transition-opacity">
          Presciya
        </Link>

        {/* Center Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/#features" className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-blue-400 transition-colors">
            Features
          </Link>
          <Link href="/#pricing" className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-blue-400 transition-colors">
            Pricing
          </Link>
          <Link href="/#workflow" className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-blue-400 transition-colors">
            Workflow
          </Link>
          <Link href="/demo" className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-blue-400 transition-colors">
            Demo
          </Link>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {/* Contrast toggle */}
          {mounted && (
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
            >
              {resolvedTheme === "dark" ? (
                <Sun className="h-5 w-5 text-amber-400" />
              ) : (
                <Moon className="h-5 w-5 text-slate-600" />
              )}
            </button>
          )}

          {/* Only signed-out visitors see the auth actions. Signed-in users do
              not get Dashboard/Logout here — those live in the dashboard
              sidebar, and signed-in users cannot reach the public pages. */}
          {mounted && !user && (
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" className="text-sm font-semibold text-primary dark:text-blue-400 hover:underline px-4 h-10">
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                {/* No `text-white` here: in dark mode `primary` is a light blue,
                    so white would be unreadable. The variant supplies
                    `text-on-primary`, which is correct in both themes. */}
                <Button className="bg-primary hover:bg-primary/90 px-5 py-2 rounded-full text-sm font-bold shadow-sm h-10">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
