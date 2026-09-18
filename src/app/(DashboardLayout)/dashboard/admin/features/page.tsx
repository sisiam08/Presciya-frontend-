"use client";

import React, { useState, useEffect } from "react";
import { ToggleRight, Loader2, RefreshCw, Search, Sparkles, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/constants";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800 ${className}`} />;
}

export default function AdminFeaturesPage() {
  const [features, setFeatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const loadFeatures = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<any>(API_ROUTES.ADMIN.PLANS);
      const plans = res.data?.data || res.data || [];
      
      const uniqueFeaturesMap = new Map<string, any>();
      plans.forEach((plan: any) => {
        plan.planFeatures?.forEach((pf: any) => {
          if (pf.feature && !uniqueFeaturesMap.has(pf.feature.id)) {
            uniqueFeaturesMap.set(pf.feature.id, {
              ...pf.feature,
              isEnabledGlobally: true,
            });
          }
        });
      });
      
      setFeatures(Array.from(uniqueFeaturesMap.values()));
    } catch {
      setFeatures([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadFeatures();
  }, []);

  const handleToggle = async (featureId: string, currentEnabled: boolean) => {
    setTogglingId(featureId);
    try {
      await apiClient.patch(API_ROUTES.ADMIN.TOGGLE_FEATURE(featureId), {
        enabled: !currentEnabled,
      });
      setFeatures((prev) =>
        prev.map((f) =>
          f.id === featureId ? { ...f, isEnabledGlobally: !currentEnabled } : f
        )
      );
      toast({ title: "Feature Flag Updated", description: `Feature flag ${!currentEnabled ? "enabled" : "disabled"} globally.`, variant: "success" });
    } catch (e: any) {
      toast({ title: "Toggle Error", description: e?.response?.data?.message || "Failed to toggle feature flag.", variant: "destructive" });
    }
    setTogglingId(null);
  };

  const enabledCount = features.filter((f) => f.isEnabledGlobally).length;
  const disabledCount = features.length - enabledCount;

  const filtered = features.filter((f) => {
    const q = search.toLowerCase();
    return (
      (f.featureName && f.featureName.toLowerCase().includes(q)) ||
      (f.key && f.key.toLowerCase().includes(q)) ||
      (f.description && f.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Global Feature Flags & Toggles
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Dynamically enable or disable product capabilities across the platform
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadFeatures} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Bento Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex items-center gap-4 shadow-xs">
          <div className="h-11 w-11 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <ToggleRight className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{features.length}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Registered Features</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex items-center gap-4 shadow-xs">
          <div className="h-11 w-11 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{enabledCount}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Enabled Globally</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex items-center gap-4 shadow-xs">
          <div className="h-11 w-11 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <XCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{disabledCount}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Disabled / Offline</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          className="pl-10 h-10 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl"
          placeholder="Filter feature flags by key or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Feature Cards Grid */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
          <ToggleRight className="h-12 w-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <p className="font-semibold text-slate-700 dark:text-slate-300">No feature flags found</p>
          <p className="text-xs text-slate-400 mt-0.5">Try searching with a different term</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((feat) => {
            const isToggling = togglingId === feat.id;
            return (
              <div
                key={feat.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex items-center justify-between gap-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <p className="font-bold text-base text-slate-900 dark:text-slate-100 capitalize">
                      {feat.featureName || feat.key?.replace(/_/g, " ")}
                    </p>
                    <span className="text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {feat.key}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {feat.description || "System feature flag to toggle module access globally."}
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                      feat.isEnabledGlobally
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                        : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800"
                    }`}
                  >
                    {feat.isEnabledGlobally ? "Enabled" : "Disabled"}
                  </span>
                  <button
                    onClick={() => handleToggle(feat.id, feat.isEnabledGlobally)}
                    disabled={isToggling}
                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      feat.isEnabledGlobally ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        feat.isEnabledGlobally ? "translate-x-5" : "translate-x-0"
                      } flex items-center justify-center`}
                    >
                      {isToggling && <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
