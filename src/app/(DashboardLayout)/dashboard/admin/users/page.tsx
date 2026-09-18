"use client";

import React, { useState, useEffect } from "react";
import { Users, Search, Shield, Trash2, ShieldCheck, UserCheck, RefreshCw, UserX, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/constants";
import { User, SystemRole } from "@/types";
import { formatDate } from "@/lib/utils";
import { useConfirm } from "@/components/ui/confirm";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800 ${className}`} />;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | SystemRole>("all");
  const confirm = useConfirm();

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<any>(API_ROUTES.ADMIN.USERS);
      setUsers(res.data?.data || res.data || []);
    } catch { setUsers([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleActive = async (user: User) => {
    try {
      await apiClient.patch(API_ROUTES.ADMIN.UPDATE_USER(user.id), { isActive: !user.isActive });
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, isActive: !u.isActive } : u));
      toast({ title: "User Updated", description: `${user.name} is now ${!user.isActive ? "Active" : "Inactive"}.`, variant: "success" });
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.message || "Failed to update user status.", variant: "destructive" });
    }
  };

  const toggleRole = async (user: User) => {
    const newRole = user.systemRole === SystemRole.SUPER_ADMIN ? SystemRole.USER : SystemRole.SUPER_ADMIN;
    const ok = await confirm({
      title: "Change system role?",
      description: `Change ${user.name}'s system role to ${newRole}?`,
      confirmLabel: "Change role",
      variant: "default",
    });
    if (!ok) return;
    try {
      await apiClient.patch(API_ROUTES.ADMIN.UPDATE_USER(user.id), { systemRole: newRole });
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, systemRole: newRole } : u));
      toast({ title: "Role Changed", description: `${user.name}'s role updated to ${newRole}.`, variant: "success" });
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.message || "Failed to update role.", variant: "destructive" });
    }
  };

  const deleteUser = async (id: string, name: string) => {
    const ok = await confirm({
      title: "Deactivate user account?",
      description: `Deactivate "${name}"? The account will be signed out and its memberships set inactive. Workspaces, prescriptions and patient records are preserved.`,
      confirmLabel: "Deactivate",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await apiClient.delete(API_ROUTES.ADMIN.DELETE_USER(id));
      toast({
        title: "User Deactivated",
        description: `${name}'s account has been deactivated.`,
        variant: "default",
      });
      load();
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.message || "Failed to deactivate user.", variant: "destructive" });
    }
  };

  const activeCount = users.filter((u) => u.isActive).length;
  const adminCount = users.filter((u) => u.systemRole === SystemRole.SUPER_ADMIN).length;

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch = u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchesRole = roleFilter === "all" || u.systemRole === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            User Management & Access Control
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage system roles, active accounts, and permissions
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Stat Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex items-center gap-4 shadow-xs">
          <div className="h-11 w-11 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{users.length}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Registered Users</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex items-center gap-4 shadow-xs">
          <div className="h-11 w-11 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{activeCount}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Active Accounts ({users.length > 0 ? Math.round((activeCount / users.length) * 100) : 0}%)</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex items-center gap-4 shadow-xs">
          <div className="h-11 w-11 rounded-xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{adminCount}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Super Admin Accounts</p>
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            className="pl-10 h-10 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl"
            placeholder="Search by user name or email address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setRoleFilter("all")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              roleFilter === "all"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            All Users ({users.length})
          </button>
          <button
            onClick={() => setRoleFilter(SystemRole.SUPER_ADMIN)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              roleFilter === SystemRole.SUPER_ADMIN
                ? "bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 shadow-xs"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            Super Admins ({adminCount})
          </button>
          <button
            onClick={() => setRoleFilter(SystemRole.USER)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              roleFilter === SystemRole.USER
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            Standard Users
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-sm text-slate-500 dark:text-slate-400">
            <Users className="h-10 w-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">No users found</p>
            <p className="text-xs text-slate-400 mt-0.5">Try searching with a different keyword</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  {["User Details", "Email", "System Role", "Account Status", "Registered", "Actions"].map((h) => (
                    <th key={h} className="text-left py-3.5 px-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((user) => {
                  const isSuperAdmin = user.systemRole === SystemRole.SUPER_ADMIN;
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold ${
                            isSuperAdmin
                              ? "bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800"
                              : "bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400"
                          }`}>
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{user.name}</p>
                            <p className="text-[11px] text-slate-400 font-mono">ID: {user.id.substring(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-sm text-slate-600 dark:text-slate-400 font-medium">{user.email}</td>
                      <td className="py-3.5 px-5">
                        <button
                          onClick={() => toggleRole(user)}
                          title="Click to toggle system role"
                          className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold transition-all cursor-pointer hover:scale-105 ${
                            isSuperAdmin
                              ? "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          {isSuperAdmin && <Shield className="h-3 w-3 text-red-600" />}
                          {user.systemRole}
                        </button>
                      </td>
                      <td className="py-3.5 px-5">
                        <button
                          onClick={() => toggleActive(user)}
                          className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-bold transition-all cursor-pointer hover:scale-105 ${
                            user.isActive
                              ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                              : "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                          }`}
                        >
                          {user.isActive ? (
                            <><CheckCircle className="h-3 w-3" /> Active</>
                          ) : (
                            <><XCircle className="h-3 w-3" /> Inactive</>
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-5 text-xs text-slate-500 dark:text-slate-400 font-medium">{formatDate(user.createdAt)}</td>
                      <td className="py-3.5 px-5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 h-8 px-2"
                          onClick={() => deleteUser(user.id, user.name)}
                          title="Deactivate User Account"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
