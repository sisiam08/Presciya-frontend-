// src/app/(DashboardLayout)/layout.tsx
import DashboardShell from "@/components/layout/DashboardShell";

export const metadata = {
  title: "Dashboard – Presciya",
  // Private application area: it must never be indexed by search engines.
  robots: { index: false, follow: false },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
