"use client";

import React, { useState, useEffect } from "react";
import { PackageCheck, RefreshCw, Loader2, Plus, Save, Pencil, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/constants";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800 ${className}`} />;
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showNewPlan, setShowNewPlan] = useState(false);
  const [newPlan, setNewPlan] = useState({
    variantName: "", price: "", dailyPrescriptionLimit: "",
    descriptionEn: "", descriptionBn: "",
  });
  const [saving, setSaving] = useState(false);
  const [editingPrice, setEditingPrice] = useState<Record<string, string>>({});

  const loadPlans = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<any>(API_ROUTES.ADMIN.PLANS);
      setPlans(res.data?.data || res.data || []);
    } catch {
      setPlans([]);
    }
    setLoading(false);
  };

  useEffect(() => { loadPlans(); }, []);

  const handleUpdateLimit = async (variantId: string, featureId: string, limitValue: number | null) => {
    const key = `${variantId}-${featureId}`;
    setUpdatingId(key);
    try {
      await apiClient.post(API_ROUTES.ADMIN.SET_PLAN_FEATURE_LIMIT(variantId, featureId), { limitValue });
      loadPlans();
      toast({ title: "Limit Updated", description: "Feature limit saved.", variant: "success" });
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.message || "Failed to update limit.", variant: "destructive" });
    }
    setUpdatingId(null);
  };

  const handleCreatePlan = async () => {
    if (!newPlan.variantName.trim() || !newPlan.price) {
      toast({ title: "Validation", description: "Plan name and price are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await apiClient.post("/subscription/plans", {
        variantName: newPlan.variantName,
        price: parseFloat(newPlan.price),
        dailyPrescriptionLimit: parseInt(newPlan.dailyPrescriptionLimit) || 3,
        description: { en: newPlan.descriptionEn, bn: newPlan.descriptionBn },
        isActive: true,
      });
      setShowNewPlan(false);
      setNewPlan({ variantName: "", price: "", dailyPrescriptionLimit: "", descriptionEn: "", descriptionBn: "" });
      loadPlans();
      toast({ title: "Plan Created", description: "New subscription plan created.", variant: "success" });
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.message || "Failed to create plan.", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleTogglePlan = async (plan: any) => {
    try {
      await apiClient.patch(`/subscription/plans/${plan.id}`, { isActive: !plan.isActive });
      setPlans((prev) => prev.map((p) => p.id === plan.id ? { ...p, isActive: !p.isActive } : p));
      toast({ title: "Plan Updated", description: `Plan is now ${!plan.isActive ? "active" : "inactive"}.`, variant: "success" });
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.message || "Failed to update plan.", variant: "destructive" });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Plans & Pricing</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Configure subscription tiers, pricing, and usage limits</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadPlans}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          <Button size="sm" onClick={() => setShowNewPlan(!showNewPlan)}>
            <Plus className="h-4 w-4 mr-1" /> New Plan
          </Button>
        </div>
      </div>

      {/* New Plan Form */}
      {showNewPlan && (
        <div className="rounded-2xl border border-primary/30 bg-white dark:bg-slate-900 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Create New Plan</h2>
            <button onClick={() => setShowNewPlan(false)} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Plan Name *</label>
              <Input placeholder="e.g. Professional" value={newPlan.variantName} onChange={(e) => setNewPlan((p) => ({ ...p, variantName: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Price (BDT) *</label>
              <Input type="number" placeholder="e.g. 999" value={newPlan.price} onChange={(e) => setNewPlan((p) => ({ ...p, price: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Daily Prescription Limit</label>
              <Input type="number" placeholder="e.g. 50" value={newPlan.dailyPrescriptionLimit} onChange={(e) => setNewPlan((p) => ({ ...p, dailyPrescriptionLimit: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Description (English)</label>
              <Input placeholder="Brief plan description in English" value={newPlan.descriptionEn} onChange={(e) => setNewPlan((p) => ({ ...p, descriptionEn: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">বিবরণ (বাংলা)</label>
              <Input placeholder="বাংলায় সংক্ষিপ্ত বিবরণ" value={newPlan.descriptionBn} onChange={(e) => setNewPlan((p) => ({ ...p, descriptionBn: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
            <Button onClick={handleCreatePlan} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
              Create Plan
            </Button>
            <Button variant="outline" onClick={() => setShowNewPlan(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
          <PackageCheck className="h-12 w-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-500 dark:text-slate-400">No subscription plans found.</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Create your first plan using the button above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {plans.map((plan) => (
            <div key={plan.id} className={`rounded-2xl border bg-white dark:bg-slate-900 overflow-hidden flex flex-col ${plan.isActive ? "border-slate-200 dark:border-slate-700" : "border-dashed border-slate-300 dark:border-slate-700 opacity-70"}`}>
              {/* Plan header */}
              <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{plan.variantName}</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                      {(plan.description as any)?.en || "—"}
                    </p>
                  </div>
                  <button
                    onClick={() => handleTogglePlan(plan)}
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${plan.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                  >
                    {plan.isActive ? "Active" : "Inactive"}
                  </button>
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">৳{plan.price}</span>
                  <span className="text-xs text-slate-400 ml-1">/month</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Daily prescription limit: <span className="font-semibold text-slate-700 dark:text-slate-300">{plan.dailyPrescriptionLimit}</span>
                </p>
              </div>

              {/* Feature limits */}
              <div className="p-5 flex-1">
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Feature Limits</p>
                {!plan.planFeatures?.length ? (
                  <p className="text-xs text-slate-400 italic">No features configured.</p>
                ) : (
                  <div className="space-y-3">
                    {plan.planFeatures.map((pf: any) => {
                      const key = `${plan.id}-${pf.featureId}`;
                      const isUpdating = updatingId === key;
                      const featureName = pf.feature?.key?.replace(/_/g, " ") || pf.featureId;
                      return (
                        <div key={pf.id} className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300 capitalize">{featureName}</span>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              defaultValue={pf.limitValue ?? ""}
                              placeholder="∞"
                              disabled={isUpdating}
                              onBlur={(e) => {
                                const val = e.target.value === "" ? null : Number(e.target.value);
                                if (val !== pf.limitValue) {
                                  handleUpdateLimit(plan.id, pf.featureId, val);
                                }
                              }}
                              className="h-7 w-20 text-center text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-red-500 disabled:opacity-50"
                            />
                            {isUpdating && <Loader2 className="h-3 w-3 animate-spin text-red-500" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
