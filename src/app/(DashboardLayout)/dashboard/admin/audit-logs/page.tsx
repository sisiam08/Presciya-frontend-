"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ScrollText, Search, RefreshCw, Filter, ArrowLeftRight, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800 ${className}`} />;
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userId, setUserId] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");
  const [actionType, setActionType] = useState("");
  const [entityType, setEntityType] = useState("");

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(userId && { userId }),
        ...(workspaceId && { workspaceId }),
        ...(actionType && { actionType }),
        ...(entityType && { entityType }),
      });
      const res = await apiClient.get<any>(`${API_ROUTES.ADMIN.AUDIT_LOGS}?${params.toString()}`);
      const data = res.data?.data || res.data;
      setLogs(data?.items || data || []);
      setTotalPages(data?.totalPages || 1);
    } catch {
      setLogs([]);
    }
    setLoading(false);
  }, [page, userId, workspaceId, actionType, entityType]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const resetFilters = () => {
    setUserId("");
    setWorkspaceId("");
    setActionType("");
    setEntityType("");
    setPage(1);
  };

  const hasActiveFilters = userId || workspaceId || actionType || entityType;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            System Audit Trail & Security Logs
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Comprehensive history of resource creations, modifications, and administrative operations
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadLogs} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5" /> Filter Audit Entries
          </h3>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs text-rose-600 hover:underline flex items-center gap-1 font-semibold"
            >
              <X className="h-3.5 w-3.5" /> Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">User ID</label>
            <Input className="h-9 text-xs border-slate-200 dark:border-slate-800" placeholder="Filter by User ID..." value={userId} onChange={(e) => { setUserId(e.target.value); setPage(1); }} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Workspace ID</label>
            <Input className="h-9 text-xs border-slate-200 dark:border-slate-800" placeholder="Filter by Workspace..." value={workspaceId} onChange={(e) => { setWorkspaceId(e.target.value); setPage(1); }} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Action Type</label>
            <Input className="h-9 text-xs border-slate-200 dark:border-slate-800" placeholder="CREATE, UPDATE, DELETE..." value={actionType} onChange={(e) => { setActionType(e.target.value); setPage(1); }} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Entity Type</label>
            <Input className="h-9 text-xs border-slate-200 dark:border-slate-800" placeholder="PATIENT, PRESCRIPTION..." value={entityType} onChange={(e) => { setEntityType(e.target.value); setPage(1); }} />
          </div>
        </div>
      </div>

      {/* Logs Table Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-20 text-slate-500 dark:text-slate-400">
            <ScrollText className="h-12 w-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">No audit logs matching search criteria</p>
            <p className="text-xs text-slate-400 mt-0.5">Try clearing your filters above</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  {["Timestamp", "User Account", "Workspace Scope", "Action", "Target Entity", "Change Summary"].map((h) => (
                    <th key={h} className="text-left py-3.5 px-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors text-xs">
                    <td className="py-3.5 px-5 text-slate-500 dark:text-slate-400 whitespace-nowrap font-medium">{formatDateTime(log.createdAt)}</td>
                    <td className="py-3.5 px-5">
                      <p className="font-bold text-slate-900 dark:text-slate-100">{log.user?.name || "System"}</p>
                      <p className="text-[10px] text-slate-400">{log.user?.email || "—"}</p>
                    </td>
                    <td className="py-3.5 px-5 text-slate-700 dark:text-slate-300 font-medium">
                      {log.workspace?.name ? (
                        <>
                          <p className="font-bold text-slate-900 dark:text-slate-100">{log.workspace.name}</p>
                          <p className="text-[10px] text-slate-400 capitalize">{log.workspace.type?.toLowerCase()}</p>
                        </>
                      ) : (
                        <span className="text-slate-400 italic">Global System</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="px-2.5 py-1 rounded-full font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                        {log.actionType}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      {log.entityType} <span className="text-slate-400 text-[10px]">({log.entityId?.substring(0, 8)})</span>
                    </td>
                    <td className="py-3.5 px-5 max-w-xs">
                      {log.oldValues || log.newValues ? (
                        <div className="space-y-1 font-mono text-[11px]">
                          {log.oldValues && (
                            <p className="truncate text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded" title={JSON.stringify(log.oldValues)}>
                              - {JSON.stringify(log.oldValues)}
                            </p>
                          )}
                          {log.newValues && (
                            <p className="truncate text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded" title={JSON.stringify(log.newValues)}>
                              + {JSON.stringify(log.newValues)}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No diff logged</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(p + 1, totalPages))} disabled={page === totalPages}>
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
