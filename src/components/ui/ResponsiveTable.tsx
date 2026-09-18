"use client";

import React from "react";
import { motion } from "framer-motion";

interface ResponsiveTableProps {
  columns: {
    key: string;
    label: string;
    mobile?: boolean; // Show on mobile
    render?: (value: any) => React.ReactNode;
  }[];
  data: any[];
  onRowClick?: (row: any) => void;
  loading?: boolean;
  emptyMessage?: string;
}

export default function ResponsiveTable({
  columns,
  data,
  onRowClick,
  loading = false,
  emptyMessage = "No data found",
}: ResponsiveTableProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-6 py-3 text-left font-semibold text-gray-900 dark:text-white"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
            {data.map((row, idx) => (
              <motion.tr
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => onRowClick?.(row)}
                className={`hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors ${
                  onRowClick ? "cursor-pointer" : ""
                }`}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="px-6 py-4 text-gray-700 dark:text-gray-300"
                  >
                    {col.render ? col.render(row[col.key]) : row[col.key]}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-3">
        {data.map((row, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => onRowClick?.(row)}
            className={`bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-4 ${
              onRowClick
                ? "cursor-pointer active:bg-gray-50 dark:active:bg-slate-800"
                : ""
            }`}
          >
            {columns
              .filter((col) => col.mobile !== false) // Show by default unless mobile: false
              .map((col) => (
                <div key={col.key} className="mb-2 last:mb-0">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    {col.label}
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white font-medium">
                    {col.render ? col.render(row[col.key]) : row[col.key]}
                  </p>
                </div>
              ))}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
