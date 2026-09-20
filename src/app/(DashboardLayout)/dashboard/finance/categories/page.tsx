"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  Loader2,
  X,
  Lock,
  Power,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/constants";
import { useConfirm } from "@/components/ui/confirm";
import { useNotification } from "@/hooks/useNotification";
import { useFinanceScope } from "@/hooks/useFinanceScope";
import FeatureGate from "@/components/ui/FeatureGate";
import {
  FinancialCategory,
  FinancialTransactionType,
} from "@/types";

interface CategoryFormState {
  id?: string;
  name: string;
  type: FinancialTransactionType;
  description: string;
  isActive: boolean;
}

const emptyForm = (type: FinancialTransactionType): CategoryFormState => ({
  name: "",
  type,
  description: "",
  isActive: true,
});

export default function FinanceCategoriesPage() {
  return (
    <FeatureGate feature="finance" label="Finance">
      <FinanceCategoriesContent />
    </FeatureGate>
  );
}

function FinanceCategoriesContent() {
  const { workspaces, scope, setScope, can, loading: scopeLoading } = useFinanceScope();
  const { success, error: showError } = useNotification();
  const confirm = useConfirm();

  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CategoryFormState | null>(null);

  const load = useCallback(async () => {
    if (scopeLoading || !scope) return;
    setLoading(true);
    try {
      const res = await apiClient.get<any>(
        `${API_ROUTES.FINANCE.CATEGORIES}?includeInactive=true`,
      );
      setCategories(res.data?.data || res.data || []);
    } catch (e: any) {
      showError(e?.response?.data?.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, scopeLoading]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    if (!form) return;
    if (!form.name.trim()) return showError("Category name is required");
    setSaving(true);
    try {
      if (form.id) {
        await apiClient.patch(API_ROUTES.FINANCE.CATEGORY(form.id), {
          name: form.name.trim(),
          description: form.description.trim() || null,
          isActive: form.isActive,
        });
        success("Category updated");
      } else {
        await apiClient.post(API_ROUTES.FINANCE.CATEGORIES, {
          name: form.name.trim(),
          type: form.type,
          description: form.description.trim() || undefined,
        });
        success("Category created");
      }
      setForm(null);
      load();
    } catch (e: any) {
      showError(e?.response?.data?.message || "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (cat: FinancialCategory) => {
    try {
      await apiClient.patch(API_ROUTES.FINANCE.CATEGORY(cat.id), {
        isActive: !cat.isActive,
      });
      success(cat.isActive ? "Category deactivated" : "Category activated");
      load();
    } catch (e: any) {
      showError(e?.response?.data?.message || "Failed to update category");
    }
  };

  const handleDelete = async (cat: FinancialCategory) => {
    const ok = await confirm({
      title: `Delete "${cat.name}"?`,
      description:
        "Categories used by existing transactions cannot be deleted — deactivate them instead.",
      confirmLabel: "Delete category",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await apiClient.delete(API_ROUTES.FINANCE.CATEGORY(cat.id));
      success("Category deleted");
      load();
    } catch (e: any) {
      showError(e?.response?.data?.message || "Failed to delete category");
    }
  };

  const renderGroup = (type: FinancialTransactionType, title: string) => {
    const items = categories.filter((c) => c.type === type);
    return (
      <div className="overflow-hidden rounded-2xl border border-outline-variant bg-surface">
        <div className="flex items-center justify-between border-b border-outline-variant px-6 py-4">
          <h3 className="text-base font-bold text-on-surface">{title}</h3>
          {can.update && (
            <Button size="sm" variant="outline" onClick={() => setForm(emptyForm(type))}>
              <Plus className="mr-1 h-4 w-4" /> Add
            </Button>
          )}
        </div>
        {items.length === 0 ? (
          <p className="px-6 py-6 text-sm text-on-surface-variant">
            No categories.
          </p>
        ) : (
          <div className="divide-y divide-outline-variant/40">
            {items.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between gap-3 px-6 py-3"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-medium text-on-surface">
                    {cat.name}
                    {cat.isSystem && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-surface-container px-2 py-0.5 text-[10px] font-semibold text-on-surface-variant">
                        <Lock className="h-2.5 w-2.5" /> Default
                      </span>
                    )}
                    {!cat.isActive && (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                        Inactive
                      </span>
                    )}
                  </p>
                  {cat.description && (
                    <p className="truncate text-xs text-on-surface-variant">
                      {cat.description}
                    </p>
                  )}
                </div>
                {!cat.isSystem && (
                  <div className="flex flex-shrink-0 items-center gap-1">
                    {can.update && (
                      <>
                        <button
                          onClick={() => toggleActive(cat)}
                          title={cat.isActive ? "Deactivate" : "Activate"}
                          className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container"
                        >
                          <Power size={14} />
                        </button>
                        <button
                          onClick={() =>
                            setForm({
                              id: cat.id,
                              name: cat.name,
                              type: cat.type,
                              description: cat.description || "",
                              isActive: cat.isActive,
                            })
                          }
                          title="Edit"
                          className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container"
                        >
                          <Pencil size={14} />
                        </button>
                      </>
                    )}
                    {can.delete && (
                      <button
                        onClick={() => handleDelete(cat)}
                        title="Delete"
                        className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Link
            href="/dashboard/finance"
            className="mb-1 inline-flex items-center gap-1 text-xs font-semibold text-on-surface-variant hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Finance
          </Link>
          <h1 className="text-2xl font-bold text-on-surface">Categories</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Default categories are shared; you can add your own per workspace.
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={scope === "all" ? workspaces[0]?.id || "" : scope}
            onChange={(e) => setScope(e.target.value)}
            className="h-9 rounded-lg border border-outline-variant bg-surface px-3 text-sm text-on-surface focus:outline-none"
          >
            {workspaces.map((ws) => (
              <option key={ws.id} value={ws.id}>
                {ws.name}
              </option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="mr-1 h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-on-surface-variant">
          <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Loading…
        </div>
      ) : (
        <div className="space-y-6">
          {renderGroup(FinancialTransactionType.INCOME, "Income Categories")}
          {renderGroup(FinancialTransactionType.EXPENSE, "Expense Categories")}
        </div>
      )}

      {/* Category form modal */}
      {form && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setForm(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-outline-variant bg-surface p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-on-surface">
                {form.id ? "Edit Category" : "Add Category"}
              </h2>
              <button
                onClick={() => setForm(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant">
                  Name *
                </label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Chamber Rent"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant">
                  Type
                </label>
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      type: e.target.value as FinancialTransactionType,
                    })
                  }
                  disabled={Boolean(form.id)}
                  className="h-10 w-full rounded-lg border border-outline-variant bg-surface px-3 text-sm text-on-surface focus:outline-none disabled:opacity-60"
                >
                  <option value="INCOME">Income</option>
                  <option value="EXPENSE">Expense</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant">
                  Description
                </label>
                <Textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <Button variant="ghost" onClick={() => setForm(null)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {saving ? "Saving…" : form.id ? "Save Changes" : "Create Category"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
