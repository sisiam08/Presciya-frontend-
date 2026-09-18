// src/app/(DashboardLayout)/layout.tsx
import Sidebar from "@/components/layout/Sidebar";

export const metadata = {
  title: "Dashboard – Presciya",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-y-auto p-4 md:p-6 lg:p-8 bg-slate-50 dark:bg-slate-950">
        {children}
      </main>
    </div>
  );
}
