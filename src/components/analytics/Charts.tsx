"use client";

import React from "react";
import { Line, Bar, Pie, Doughnut } from "react-chartjs-2";
import { useTheme } from "next-themes";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

interface ChartProps {
  title?: string;
  height?: number;
}

interface LineChartProps extends ChartProps {
  data: number[];
  labels: string[];
  label?: string;
  borderColor?: string;
  backgroundColor?: string;
}

export function LineChart({
  title,
  height = 300,
  data,
  labels,
  label = "Data",
  borderColor = "#0058bc",
  backgroundColor = "rgba(0, 88, 188, 0.1)",
}: LineChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const gridColor = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(11, 28, 48, 0.05)";
  const tickColor = isDark ? "#c1c6d7" : "#414755";

  const chartData = {
    labels,
    datasets: [
      {
        label,
        data,
        borderColor: isDark ? "#adc6ff" : borderColor,
        backgroundColor: isDark ? "rgba(173, 198, 255, 0.1)" : backgroundColor,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: isDark ? "#adc6ff" : borderColor,
        pointBorderColor: isDark ? "#0f172a" : "#fff",
        pointBorderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: title ? { display: true, text: title, color: tickColor } : undefined,
      tooltip: {
        backgroundColor: isDark ? "#1e2a41" : "#ffffff",
        titleColor: isDark ? "#f8f9ff" : "#0b1c30",
        bodyColor: isDark ? "#c1c6d7" : "#414755",
        borderColor: isDark ? "#30363d" : "#c1c6d7",
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: gridColor,
          drawBorder: false,
        },
        ticks: {
          color: tickColor,
        },
      },
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: tickColor,
        },
      },
    },
  };

  return (
    <div style={{ height }} className="w-full relative">
      <Line data={chartData} options={options as any} />
    </div>
  );
}

interface BarChartProps extends ChartProps {
  data: number[];
  labels: string[];
  label?: string;
  backgroundColor?: string;
  borderColor?: string;
}

export function BarChart({
  title,
  height = 300,
  data,
  labels,
  label = "Data",
  backgroundColor = "#0058bc",
  borderColor = "#0058bc",
}: BarChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const gridColor = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(11, 28, 48, 0.05)";
  const tickColor = isDark ? "#c1c6d7" : "#414755";

  const chartData = {
    labels,
    datasets: [
      {
        label,
        data,
        backgroundColor: isDark ? "#adc6ff" : backgroundColor,
        borderColor: isDark ? "#adc6ff" : borderColor,
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: title ? { display: true, text: title, color: tickColor } : undefined,
      tooltip: {
        backgroundColor: isDark ? "#1e2a41" : "#ffffff",
        titleColor: isDark ? "#f8f9ff" : "#0b1c30",
        bodyColor: isDark ? "#c1c6d7" : "#414755",
        borderColor: isDark ? "#30363d" : "#c1c6d7",
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: gridColor,
          drawBorder: false,
        },
        ticks: {
          color: tickColor,
        },
      },
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: tickColor,
        },
      },
    },
  };

  return (
    <div style={{ height }} className="w-full relative">
      <Bar data={chartData} options={options as any} />
    </div>
  );
}

interface PieChartProps extends ChartProps {
  data: number[];
  labels: string[];
  colors?: string[];
}

export function PieChart({
  title,
  height = 300,
  data,
  labels,
  colors = ["#0058bc", "#006a61", "#00bcd4", "#ff6b6b", "#4ecdc4", "#ffd93d"],
}: PieChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const tickColor = isDark ? "#c1c6d7" : "#414755";

  const themeColors = isDark 
    ? ["#adc6ff", "#6bd8cb", "#4cd7f6", "#ffb4ab", "#a7f3d0", "#fde047"]
    : colors;

  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: themeColors.slice(0, labels.length),
        borderColor: isDark ? "#151f32" : "#fff",
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color: tickColor,
          font: {
            family: "Inter",
          },
        },
      },
      title: title ? { display: true, text: title, color: tickColor } : undefined,
      tooltip: {
        backgroundColor: isDark ? "#1e2a41" : "#ffffff",
        titleColor: isDark ? "#f8f9ff" : "#0b1c30",
        bodyColor: isDark ? "#c1c6d7" : "#414755",
        borderColor: isDark ? "#30363d" : "#c1c6d7",
        borderWidth: 1,
      },
    },
  };

  return (
    <div style={{ height }} className="w-full relative">
      <Pie data={chartData} options={options as any} />
    </div>
  );
}

interface DoughnutChartProps extends ChartProps {
  data: number[];
  labels: string[];
  colors?: string[];
}

export function DoughnutChart({
  title,
  height = 300,
  data,
  labels,
  colors = ["#0058bc", "#006a61", "#00bcd4", "#ff6b6b", "#4ecdc4", "#ffd93d"],
}: DoughnutChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const tickColor = isDark ? "#c1c6d7" : "#414755";

  const themeColors = isDark 
    ? ["#adc6ff", "#6bd8cb", "#4cd7f6", "#ffb4ab", "#a7f3d0", "#fde047"]
    : colors;

  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: themeColors.slice(0, labels.length),
        borderColor: isDark ? "#151f32" : "#fff",
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color: tickColor,
          font: {
            family: "Inter",
          },
        },
      },
      title: title ? { display: true, text: title, color: tickColor } : undefined,
      tooltip: {
        backgroundColor: isDark ? "#1e2a41" : "#ffffff",
        titleColor: isDark ? "#f8f9ff" : "#0b1c30",
        bodyColor: isDark ? "#c1c6d7" : "#414755",
        borderColor: isDark ? "#30363d" : "#c1c6d7",
        borderWidth: 1,
      },
    },
  };

  return (
    <div style={{ height }} className="w-full relative">
      <Doughnut data={chartData} options={options as any} />
    </div>
  );
}
