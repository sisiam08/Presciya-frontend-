// src/components/dashboard/ChartJSWrapper.tsx
"use client";

import { useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartConfiguration,
} from "chart.js";

// Register elements
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartProps {
  type: "line" | "bar";
  data: any;
  options?: any;
  height?: number;
}

export default function ChartJSWrapper({ type, data, options, height = 300 }: ChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<ChartJS | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Destroy existing instance if any
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    // Apply some custom global options
    const defaultOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: "rgba(156, 163, 175, 0.9)", // gray-400
            font: {
              family: "Inter, sans-serif",
            },
          },
        },
        tooltip: {
          backgroundColor: "rgba(17, 24, 39, 0.9)", // dark tooltip
          titleFont: { family: "Inter" },
          bodyFont: { family: "Inter" },
          padding: 12,
          cornerRadius: 8,
        },
      },
      scales: {
        x: {
          grid: {
            color: "rgba(156, 163, 175, 0.1)", // subtle grid
          },
          ticks: {
            color: "rgba(156, 163, 175, 0.8)",
            font: { family: "Inter" },
          },
        },
        y: {
          grid: {
            color: "rgba(156, 163, 175, 0.1)",
          },
          ticks: {
            color: "rgba(156, 163, 175, 0.8)",
            font: { family: "Inter" },
          },
        },
      },
    };

    const mergedOptions = {
      ...defaultOptions,
      ...options,
      plugins: {
        ...defaultOptions.plugins,
        ...options?.plugins,
      },
      scales: {
        ...defaultOptions.scales,
        ...options?.scales,
      },
    };

    chartInstanceRef.current = new ChartJS(ctx, {
      type,
      data,
      options: mergedOptions,
    } as ChartConfiguration);

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [type, data, options]);

  return (
    <div style={{ height }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
