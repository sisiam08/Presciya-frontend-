"use client";

import React, { useState, useEffect } from "react";
import {
  Building,
  Users,
  Layers,
  FileText,
  TrendingUp,
  CalendarDays,
  Activity,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/constants";
import { InstitutionProfile, VerificationStatus } from "@/types";
import { VERIFICATION_STATUS_CONFIG } from "@/lib/constants";

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-outline-variant bg-surface p-5 flex items-center gap-4">
      <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-on-surface">{value}</p>
        <p className="text-xs text-on-surface-variant">{label}</p>
      </div>
    </div>
  );
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-outline-variant/30 ${className}`} />;
}

export default function InstitutionOverviewPage() {
  const [profile, setProfile] = useState<InstitutionProfile | null>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [profRes, docRes, deptRes] = await Promise.all([
          apiClient.get<any>(API_ROUTES.INSTITUTION.PROFILE),
          apiClient.get<any>(API_ROUTES.INSTITUTION.DOCTORS).catch(() => ({ data: [] })),
          apiClient.get<any>(API_ROUTES.INSTITUTION.DEPARTMENTS).catch(() => ({ data: [] })),
        ]);
        setProfile(profRes.data?.data || profRes.data);
        setDoctors(docRes.data?.data || docRes.data || []);
        setDepartments(deptRes.data?.data || deptRes.data || []);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const vCfg = profile
    ? VERIFICATION_STATUS_CONFIG[profile.verificationStatus]
    : null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-5 flex-wrap">
        {profile?.logoUrl ? (
          <img src={profile.logoUrl} alt="Logo" className="h-16 w-16 rounded-2xl object-cover border border-outline-variant" />
        ) : (
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Building className="h-8 w-8 text-primary" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-on-surface">{profile?.legalName || "Institution"}</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">{profile?.address || "No address set"}</p>
          {vCfg && (
            <span className={`inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium border ${vCfg.color}`}>
              {vCfg.label}
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Doctors" value={doctors.length} icon={Users} color="bg-primary/10 text-primary" />
        <StatCard label="Departments" value={departments.length} icon={Layers} color="bg-blue-100 text-blue-600" />
        <StatCard label="Active Doctors" value={doctors.filter((d: any) => d.status === "ACTIVE").length} icon={Activity} color="bg-emerald-100 text-emerald-600" />
        <StatCard label="Today" value="—" icon={CalendarDays} color="bg-amber-100 text-amber-600" />
      </div>

      {/* Recent doctors */}
      <div className="rounded-2xl border border-outline-variant bg-surface overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-outline-variant">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-on-surface">Assigned Doctors</h2>
        </div>
        {doctors.length === 0 ? (
          <div className="text-center py-12 text-sm text-on-surface-variant">
            No doctors assigned yet. Invite doctors from the Doctors page.
          </div>
        ) : (
          <div className="divide-y divide-outline-variant">
            {doctors.slice(0, 5).map((doc: any) => (
              <div key={doc.id} className="flex items-center gap-4 px-6 py-3 hover:bg-surface-container/30">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {doc.name?.charAt(0) || doc.user?.name?.charAt(0) || "D"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-on-surface truncate">{doc.name || doc.user?.name || "Doctor"}</p>
                  <p className="text-xs text-on-surface-variant">{doc.specialization || "—"}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${doc.status === "ACTIVE" ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>
                  {doc.status || "Active"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
