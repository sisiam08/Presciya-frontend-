"use client";

import React, { useState, useEffect } from "react";
import { Building2, Search, RefreshCw, Users, Layers, ShieldCheck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800 ${className}`} />;
}

const TYPE_COLORS: Record<string, string> = {
  PERSONAL: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  INSTITUTION: "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800",
};

export default function AdminWorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "PERSONAL" | "INSTITUTION">("all");

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<any>(API_ROUTES.ADMIN.WORKSPACES);
      setWorkspaces(res.data?.data || res.data || []);
    } catch {
      setWorkspaces([]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const institutionCount = workspaces.filter((w) => w.type === "INSTITUTION").length;
  const personalCount = workspaces.filter((w) => w.type === "PERSONAL").length;

  const filtered = workspaces.filter((w) => {
    const q = search.toLowerCase();
    const matchesSearch = w.name?.toLowerCase().includes(q) || w.slug?.toLowerCase().includes(q) || w.owner?.name?.toLowerCase().includes(q);
    const matchesType = typeFilter === "all" || w.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Workspace Ecosystem Directory
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Overview of personal chambers and institutional medical enterprise workspaces
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Bento KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex items-center gap-4 shadow-xs">
          <div className="h-11 w-11 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{workspaces.length}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Registered Workspaces</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex items-center gap-4 shadow-xs">
          <div className="h-11 w-11 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{institutionCount}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Hospital & Institution Workspaces</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex items-center gap-4 shadow-xs">
          <div className="h-11 w-11 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <User className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{personalCount}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Personal Doctor Chambers</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            className="pl-10 h-10 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl"
            placeholder="Search by workspace name, slug, or owner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setTypeFilter("all")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              typeFilter === "all"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            All ({workspaces.length})
          </button>
          <button
            onClick={() => setTypeFilter("INSTITUTION")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              typeFilter === "INSTITUTION"
                ? "bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            Institutions ({institutionCount})
          </button>
          <button
            onClick={() => setTypeFilter("PERSONAL")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              typeFilter === "PERSONAL"
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            Personal ({personalCount})
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-500 dark:text-slate-400">
            <Building2 className="h-12 w-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">No workspaces found</p>
            <p className="text-xs text-slate-400 mt-0.5">Try searching with a different term</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  {["Workspace Name", "Unique Slug", "Type", "Owner Info", "Members", "Created Date"].map((h) => (
                    <th key={h} className="text-left py-3.5 px-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((ws) => (
                  <tr key={ws.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-xs">
                          {ws.name?.charAt(0)?.toUpperCase() || "W"}
                        </div>
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{ws.name}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-xs font-mono text-slate-500 dark:text-slate-400">{ws.slug}</td>
                    <td className="py-3.5 px-5">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${TYPE_COLORS[ws.type] || "bg-slate-100 text-slate-600"}`}>
                        {ws.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{ws.owner?.name || "—"}</p>
                      <p className="text-xs text-slate-400">{ws.owner?.email || ""}</p>
                    </td>
                    <td className="py-3.5 px-5 text-sm text-slate-700 dark:text-slate-300 font-bold">
                      {ws._count?.memberships ?? ws.memberships?.length ?? 1}
                    </td>
                    <td className="py-3.5 px-5 text-xs font-medium text-slate-500 dark:text-slate-400">{formatDate(ws.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
