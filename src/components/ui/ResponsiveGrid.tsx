"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ResponsiveGridProps {
  columns?: number; // Desktop columns (2-4)
  gap?: string;
  children: React.ReactNode;
  loading?: boolean;
  emptyMessage?: string;
}

export default function ResponsiveGrid({
  columns = 2,
  gap = "gap-4",
  children,
  loading = false,
  emptyMessage,
}: ResponsiveGridProps) {
  const gridClass = `grid grid-cols-1 md:grid-cols-${Math.min(columns, 2)} lg:grid-cols-${columns} ${gap}`;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      className={gridClass}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ staggerChildren: 0.1 }}
    >
      <AnimatePresence mode="popLayout">{children}</AnimatePresence>
    </motion.div>
  );
}

// Responsive Card Component
interface ResponsiveCardProps {
  children: React.ReactNode;
  onClick?: () => void;
  hoverable?: boolean;
}

export function ResponsiveCard({
  children,
  onClick,
  hoverable = true,
}: ResponsiveCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={hoverable ? { y: -2 } : {}}
      onClick={onClick}
      className={`bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-4 transition-all ${
        onClick || hoverable ? "cursor-pointer hover:shadow-md" : ""
      }`}
    >
      {children}
    </motion.div>
  );
}
