"use client";

import React, { useState, useEffect } from "react";
import { Layers, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/constants";
import { Department } from "@/types";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-outline-variant/30 ${className}`} />;
}

export default function InstitutionDepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<any>(API_ROUTES.INSTITUTION.DEPARTMENTS);
      setDepartments(res.data?.data || res.data || []);
    } catch { setDepartments([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createDept = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await apiClient.post(API_ROUTES.INSTITUTION.CREATE_DEPARTMENT, { name: newName, description: newDesc });
      setNewName(""); setNewDesc(""); setShowCreate(false);
      load();
      toast({ title: "Department Created", description: `Department "${newName}" created.`, variant: "success" });
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.message || "Failed to create department.", variant: "destructive" });
    }
    setCreating(false);
  };

  const filtered = departments.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Departments</h1>
          <p className="text-sm text-on-surface-variant">Manage clinical departments</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add Department
        </Button>
      </div>

      {showCreate && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-on-surface">New Department</h3>
          <Input placeholder="Department name" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <Input placeholder="Description (optional)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
          <div className="flex gap-2">
            <Button size="sm" onClick={createDept} disabled={creating}>{creating ? "Creating..." : "Create"}</Button>
            <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
        <Input className="pl-9" placeholder="Search departments..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-outline-variant">
          <Layers className="h-10 w-10 mx-auto mb-3 text-on-surface-variant/30" />
          <p className="text-on-surface-variant text-sm">No departments found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((dept) => (
            <div key={dept.id} className="rounded-2xl border border-outline-variant bg-surface p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Layers className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-on-surface">{dept.name}</p>
                    {dept.description && <p className="text-xs text-on-surface-variant mt-0.5">{dept.description}</p>}
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${dept.isActive ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>
                  {dept.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              {dept.doctorCount != null && (
                <p className="text-xs text-on-surface-variant mt-3 pt-3 border-t border-outline-variant">
                  {dept.doctorCount} doctor{dept.doctorCount !== 1 ? "s" : ""} assigned
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
