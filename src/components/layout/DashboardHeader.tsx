"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Sun, Moon, ChevronDown, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardHeader() {
  const { resolvedTheme, setTheme } = useTheme();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  if (!mounted) return null;

  return (
    <header className="hidden md:block sticky top-0 right-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-6 py-3 z-20 transition-colors duration-200">
      <div className="flex items-center justify-end gap-4">
        {/* Theme Toggle */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          aria-label="Toggle theme"
        >
          {resolvedTheme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </motion.button>

        {/* User Profile Dropdown */}
        <div className="relative">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-linear-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.role || "Doctor"}
                </p>
              </div>
            </div>
            <ChevronDown
              size={16}
              className={`transition-transform ${profileOpen ? "rotate-180" : ""}`}
            />
          </motion.button>

          {/* Dropdown Menu */}
          {profileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden z-50"
            >
              <div className="p-3 border-b border-gray-200 dark:border-slate-700">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.email}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.role}
                </p>
              </div>

              <div className="py-2">
                <motion.a
                  whileHover={{ x: 4 }}
                  href="/dashboard/settings"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <Settings size={16} />
                  Settings
                </motion.a>

                <motion.button
                  whileHover={{ x: 4 }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                >
                  <LogOut size={16} />
                  Logout
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </header>
  );
}
