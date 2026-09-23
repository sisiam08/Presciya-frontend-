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

/**
 * Feature labels come from the ONE canonical frontend registry
 * (`API_ROUTES.PLAN_FEATURE_INFO`), which the user-facing Subscription page
 * also renders from. This page previously kept its own hand-written map, which
 * is exactly how the Admin and User plan views drifted apart. There is now a
 * single definition; keys that are not in the registry fall back to a readable
 * form of their own key.
 */
const featureLabel = (key: string): string => {
  const info = API_ROUTES.PLAN_FEATURE_INFO[key];
  const base = info?.label ?? key.replace(/_/g, " ");
  // The admin must see the truth: this catalogue entry has no runtime
  // implementation anywhere, so toggling it changes nothing.
  return info?.implemented === false ? `${base} (not implemented)` : base;
};

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [features, setFeatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showNewPlan, setShowNewPlan] = useState(false);
  const [newPlan, setNewPlan] = useState({
    variantName: "", price: "", dailyPrescriptionLimit: "",
    descriptionEn: "", descriptionBn: "",
  });
  const [saving, setSaving] = useState(false);
  // Inline editor for a plan's name/price (admin-owned data, never hardcoded).
  const [editingPlan, setEditingPlan] = useState<{
    id: string;
    variantName: string;
    price: string;
  } | null>(null);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const [plansRes, featuresRes] = await Promise.all([
        apiClient.get<any>(API_ROUTES.ADMIN.PLANS),
        apiClient.get<any>(API_ROUTES.ADMIN.FEATURES),
      ]);
      setPlans(plansRes.data?.data || plansRes.data || []);
      setFeatures(featuresRes.data?.data || featuresRes.data || []);
    } catch {
      setPlans([]);
    }
    setLoading(false);
  };

  // Enable/disable a feature for a plan (presence = enabled) and set its limit.
  const handleSetFeature = async (
    variantId: string,
    featureId: string,
    enabled: boolean,
    limitValue: number | null,
  ) => {
    const key = `${variantId}-${featureId}`;
    setUpdatingId(key);
    try {
      await apiClient.put(
        API_ROUTES.ADMIN.SET_PLAN_FEATURE(variantId, featureId),
        { enabled, limitValue },
      );
      await loadPlans();
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.response?.data?.message || "Failed to update feature.",
        variant: "destructive",
      });
    }
    setUpdatingId(null);
  };

  useEffect(() => { loadPlans(); }, []);

  const handleCreatePlan = async () => {
    if (!newPlan.variantName.trim() || !newPlan.price) {
      toast({ title: "Validation", description: "Plan name and price are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await apiClient.post(API_ROUTES.ADMIN.PLAN_CREATE, {
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

  // Activate / deactivate a plan. Inactive plans are hidden from the public
  // plan list and cannot be purchased; existing records are untouched.
  const handleTogglePlan = async (plan: any) => {
    try {
      await apiClient.patch(API_ROUTES.ADMIN.PLAN_UPDATE(plan.id), { isActive: !plan.isActive });
      setPlans((prev) => prev.map((p) => p.id === plan.id ? { ...p, isActive: !p.isActive } : p));
      toast({ title: "Plan Updated", description: `Plan is now ${!plan.isActive ? "active" : "inactive"}.`, variant: "success" });
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.message || "Failed to update plan.", variant: "destructive" });
    }
  };

  // Save a plan's name/price. Historical subscriptions and payments keep the
  // price they were sold at — this only affects future purchases.
  const handleSavePlanDetails = async () => {
    if (!editingPlan) return;
    if (!editingPlan.variantName.trim() || editingPlan.price === "") {
      toast({ title: "Validation", description: "Plan name and price are required.", variant: "destructive" });
      return;
    }
    try {
      await apiClient.patch(API_ROUTES.ADMIN.PLAN_UPDATE(editingPlan.id), {
        variantName: editingPlan.variantName.trim(),
        price: parseFloat(editingPlan.price),
      });
      // Refetch from the server rather than trusting an optimistic patch: the
      // list must always reflect the true database state (a rename must update
      // this row, never add another one).
      await loadPlans();
      toast({ title: "Plan Updated", description: "Plan details saved.", variant: "success" });
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.message || "Failed to update plan.", variant: "destructive" });
    }
    setEditingPlan(null);
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
                  <div className="min-w-0 flex-1">
                    {editingPlan?.id === plan.id ? (
                      <Input
                        value={editingPlan?.variantName ?? ""}
                        onChange={(e) =>
                          setEditingPlan((p) => (p ? { ...p, variantName: e.target.value } : p))
                        }
                        className="h-8 text-sm"
                        placeholder="Plan name"
                      />
                    ) : (
                      <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{plan.variantName}</h2>
                    )}
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                      {(plan.description as any)?.en || "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {editingPlan?.id === plan.id ? (
                      <>
                        <button
                          onClick={handleSavePlanDetails}
                          title="Save name & price"
                          className="h-6 w-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingPlan(null)}
                          title="Cancel"
                          className="h-6 w-6 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() =>
                            setEditingPlan({
                              id: plan.id,
                              variantName: plan.variantName,
                              price: String(plan.price),
                            })
                          }
                          title="Edit name & price"
                          className="h-6 w-6 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-600"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleTogglePlan(plan)}
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${plan.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                        >
                          {plan.isActive ? "Active" : "Inactive"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex items-center">
                  {editingPlan?.id === plan.id ? (
                    <>
                      <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">৳</span>
                      <Input
                        type="number"
                        value={editingPlan?.price ?? ""}
                        onChange={(e) =>
                          setEditingPlan((p) => (p ? { ...p, price: e.target.value } : p))
                        }
                        className="h-8 w-28 text-sm ml-1"
                      />
                    </>
                  ) : (
                    <>
                      <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">৳{plan.price}</span>
                      <span className="text-xs text-slate-400 ml-1">/month</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Daily prescription limit: <span className="font-semibold text-slate-700 dark:text-slate-300">{plan.dailyPrescriptionLimit}</span>
                </p>
              </div>

              {/* Plan entitlements — the admin is the source of truth */}
              <div className="p-5 flex-1">
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Plan Entitlements</p>
                <div className="space-y-2.5">
                  {features.map((f) => {
                    const pf = plan.planFeatures?.find((x: any) => x.featureId === f.id);
                    const enabled = Boolean(pf);
                    const key = `${plan.id}-${f.id}`;
                    const isUpdating = updatingId === key;
                    const label = featureLabel(f.key);
                    return (
                      <div key={f.id} className="flex items-center justify-between gap-2">
                        <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={enabled}
                            disabled={isUpdating}
                            onChange={(e) =>
                              handleSetFeature(
                                plan.id,
                                f.id,
                                e.target.checked,
                                pf?.limitValue ?? null,
                              )
                            }
                            className="h-4 w-4 rounded border-gray-300 accent-red-500"
                          />
                          {label}
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            defaultValue={pf?.limitValue ?? ""}
                            placeholder="∞"
                            disabled={!enabled || isUpdating}
                            onBlur={(e) => {
                              const val =
                                e.target.value === "" ? null : Number(e.target.value);
                              if (enabled && val !== (pf?.limitValue ?? null)) {
                                handleSetFeature(plan.id, f.id, true, val);
                              }
                            }}
                            className="h-7 w-16 text-center text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-red-500 disabled:opacity-40"
                          />
                          {isUpdating && <Loader2 className="h-3 w-3 animate-spin text-red-500" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
