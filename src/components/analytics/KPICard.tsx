"use client";

import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";

interface KPICardProps {
  title: string;
  value: number | string;
  unit?: string;
  change?: number; // Percentage change
  trend?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
  backgroundColor?: string;
  onClick?: () => void;
}

export default function KPICard({
  title,
  value,
  unit,
  change,
  trend = "neutral",
  icon,
  backgroundColor = "from-blue-500 to-blue-600",
  onClick,
}: KPICardProps) {
  const isPositive = trend === "up";
  const isNegative = trend === "down";

  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`bg-linear-to-br ${backgroundColor} rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 text-white cursor-pointer overflow-hidden relative group`}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-5 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-300" />

      {/* Content */}
      <div className="relative z-10 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-white/80">{title}</p>
            <h3 className="text-3xl font-bold mt-1">
              {value}
              {unit && <span className="text-lg ml-1">{unit}</span>}
            </h3>
          </div>
          {icon && <div className="text-3xl opacity-80">{icon}</div>}
        </div>

        {/* Trend */}
        {change !== undefined && (
          <div
            className={`flex items-center gap-1 text-sm font-medium ${
              isPositive
                ? "text-green-200"
                : isNegative
                  ? "text-red-200"
                  : "text-white/70"
            }`}
          >
            {isPositive && <TrendingUp size={16} />}
            {isNegative && <TrendingDown size={16} />}
            <span>
              {isPositive && "+"}
              {change}%
            </span>
            <span className="text-white/60">vs last month</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// KPI Grid Component
interface KPIGridProps {
  cards: KPICardProps[];
  loading?: boolean;
}

export function KPIGrid({ cards, loading = false }: KPIGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-32 bg-surface-container rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
        >
          <KPICard {...card} />
        </motion.div>
      ))}
    </div>
  );
}

// Stat Component (smaller variant)
interface StatProps {
  label: string;
  value: number | string;
  change?: number;
  icon?: React.ReactNode;
}

export function Stat({ label, value, change, icon }: StatProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-surface-container-lowest rounded-lg border border-outline-variant">
      <div>
        <p className="text-sm text-on-surface-variant">{label}</p>
        <p className="text-2xl font-bold text-on-surface mt-1">
          {value}
        </p>
        {change !== undefined && (
          <p
            className={`text-xs font-medium mt-1 ${
              change > 0
                ? "text-secondary"
                : "text-error"
            }`}
          >
            {change > 0 && "↑"} {change}% from last month
          </p>
        )}
      </div>
      {icon && <div className="text-3xl opacity-60">{icon}</div>}
    </div>
  );
}
