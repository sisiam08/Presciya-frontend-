"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut } from "lucide-react";
import { SIDEBAR_ITEMS } from "@/lib/constants";

const ICON_MAP: Record<string, React.ReactNode> = {
  LayoutDashboard: <div>📊</div>,
  FileText: <div>📝</div>,
  Users: <div>👥</div>,
  Building2: <div>🏢</div>,
  CreditCard: <div>💳</div>,
  Settings: <div>⚙️</div>,
};

export default function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === "/dashboard" && pathname === "/dashboard") return true;
    if (href !== "/dashboard" && pathname.startsWith(href)) return true;
    return false;
  };

  return (
    <>
      {/* Mobile Navigation Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-4 z-40 transition-colors duration-200">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-teal-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">Rx</span>
          </div>
          <span className="font-bold text-lg text-gray-900 dark:text-white">
            Presciya
          </span>
        </Link>

        {/* Hamburger Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </motion.button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30 transition-colors duration-200"
            />

            {/* Drawer Panel */}
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="md:hidden fixed left-0 top-0 h-screen w-72 bg-white dark:bg-slate-900 z-30 flex flex-col shadow-xl"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-gray-200 dark:border-slate-800">
                <Link
                  href="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2"
                >
                  <div className="w-8 h-8 bg-linear-to-br from-blue-600 to-teal-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">Rx</span>
                  </div>
                  <span className="font-bold text-lg text-gray-900 dark:text-white">
                    Presciya
                  </span>
                </Link>
              </div>

              {/* Navigation Menu */}
              <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                {SIDEBAR_ITEMS.map((item, idx) => {
                  const active = isActive(item.href);
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Link href={item.href}>
                        <div
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer ${
                            active
                              ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400"
                              : "text-gray-600 dark:text-gray-400 active:bg-gray-100 dark:active:bg-slate-800"
                          }`}
                        >
                          <div className="text-lg">
                            {ICON_MAP[item.icon as string]}
                          </div>
                          <span className="font-medium">{item.label}</span>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              {/* Logout Button */}
              <div className="p-3 border-t border-gray-200 dark:border-slate-800">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                >
                  <LogOut size={20} />
                  <span className="font-medium">Logout</span>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
