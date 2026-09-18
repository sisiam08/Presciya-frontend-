"use client";

import React, { useState, useEffect } from "react";
import { Users, Plus, Trash2, Search, Mail, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/constants";
import { useConfirm } from "@/components/ui/confirm";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-outline-variant/30 ${className}`} />;
}

export default function InstitutionDoctorsPage() {
  const confirm = useConfirm();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAssign, setShowAssign] = useState(false);
  const [assignEmail, setAssignEmail] = useState("");
  const [assigning, setAssigning] = useState(false);

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<any>(API_ROUTES.INSTITUTION.DOCTORS);
      setDoctors(res.data?.data || res.data || []);
    } catch {
      setDoctors([]);
    }
    setLoading(false);
  };

  useEffect(() => { loadDoctors(); }, []);

  const assignDoctor = async () => {
    if (!assignEmail.trim()) return;
    setAssigning(true);
    try {
      await apiClient.post(API_ROUTES.INSTITUTION.ASSIGN_DOCTOR, { email: assignEmail });
      setAssignEmail("");
      setShowAssign(false);
      loadDoctors();
      toast({ title: "Doctor Assigned", description: `Assigned doctor with email ${assignEmail}`, variant: "success" });
    } catch (e: any) {
      toast({ title: "Assignment Error", description: e?.response?.data?.message || "Failed to assign doctor.", variant: "destructive" });
    }
    setAssigning(false);
  };

  const removeDoctor = async (doctorId: string) => {
    const ok = await confirm({
      title: "Remove this doctor?",
      description:
        "The doctor will be removed from this institution. Their personal account is unaffected.",
      confirmLabel: "Remove doctor",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await apiClient.delete(API_ROUTES.INSTITUTION.REMOVE_DOCTOR(doctorId));
      setDoctors((prev) => prev.filter((d) => d.id !== doctorId));
      toast({ title: "Doctor Removed", description: "Doctor removed from institution.", variant: "default" });
    } catch (e: any) {
      toast({ title: "Removal Error", description: e?.response?.data?.message || "Failed to remove doctor.", variant: "destructive" });
    }
  };

  const filtered = doctors.filter((d) => {
    const q = search.toLowerCase();
    return (d.name || d.user?.name || "").toLowerCase().includes(q) ||
           (d.email || d.user?.email || "").toLowerCase().includes(q);
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Doctors</h1>
          <p className="text-sm text-on-surface-variant">Manage doctors assigned to your institution</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadDoctors}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          <Button size="sm" onClick={() => setShowAssign(true)}>
            <Plus className="h-4 w-4 mr-1" /> Assign Doctor
          </Button>
        </div>
      </div>

      {/* Assign modal */}
      {showAssign && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
          <h3 className="text-sm font-semibold text-on-surface mb-3 flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" /> Assign Doctor by Email
          </h3>
          <div className="flex gap-2">
            <Input
              placeholder="doctor@example.com"
              value={assignEmail}
              onChange={(e) => setAssignEmail(e.target.value)}
              className="flex-1"
            />
            <Button size="sm" onClick={assignDoctor} disabled={assigning}>
              {assigning ? "Assigning..." : "Assign"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowAssign(false)}>Cancel</Button>
          </div>
          <p className="text-xs text-on-surface-variant mt-2">
            If the doctor already has a Presciya account, they will receive an invitation.
          </p>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
        <Input className="pl-9" placeholder="Search doctors..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-outline-variant bg-surface overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-on-surface-variant text-sm">
            <Users className="h-10 w-10 mx-auto mb-3 text-on-surface-variant/30" />
            No doctors assigned yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-container border-b border-outline-variant">
                <tr>
                  {["Doctor", "Specialization", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-on-surface-variant">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((doc) => (
                  <tr key={doc.id} className="border-b border-outline-variant last:border-0 hover:bg-surface-container/30">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                          {(doc.name || doc.user?.name || "D").charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-on-surface">{doc.name || doc.user?.name || "Doctor"}</p>
                          <p className="text-xs text-on-surface-variant">{doc.email || doc.user?.email || "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-on-surface-variant">{doc.specialization || "—"}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${doc.status === "ACTIVE" ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>
                        {doc.status || "Active"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 h-8" onClick={() => removeDoctor(doc.id)}>
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                      </Button>
                    </td>
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
