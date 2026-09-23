"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/constants";
import { useNotification } from "@/hooks/useNotification";
import { useEntitlements } from "@/hooks/useEntitlements";
import { useConfirm } from "@/components/ui/confirm";
import FeatureGate from "@/components/ui/FeatureGate";
import { useActiveChamber } from "@/hooks/useActiveChamber";
import { formatDateTime } from "@/lib/utils";

/**
 * Saved prescription templates.
 *
 * These are the doctor's reusable prescriptions (`PrescriptionTemplate`), a
 * different concept from the built-in DESIGN templates (Classic / Modern
 * Clinical / …) selected in Settings. The backend already owns this model and
 * scopes every request to the ACTIVE WORKSPACE (`where: { workspaceId }`), and
 * every route is gated by the `prescription_templates` entitlement — its OWN
 * entitlement, separate from the built-in DESIGN templates
 * (`prescription_design_templates`) and from the language
 * (`prescription_language`).
 *
 * The builder itself can apply a template to a new prescription and save the
 * current medicines as a new template.
 */
export default function PrescriptionTemplatesPage() {
  return (
    <FeatureGate feature="prescription_templates" label="Prescription templates">
      <TemplatesContent />
    </FeatureGate>
  );
}

interface SavedTemplate {
  id: string;
  name: string;
  description?: string | null;
  complaints?: string | null;
  advises?: string | null;
  medicinesJson?: unknown[];
  updatedAt?: string;
}

function TemplatesContent() {
  const { success, error: showError } = useNotification();
  const confirm = useConfirm();
  const activeChamberId = useActiveChamber();
  // ROOT CAUSE of the duplicate toast: the FeatureGate renders its children
  // (blurred) even when the plan lacks the feature, so this page's mount effect
  // still fired the list request, the API answered 402, and the catch showed an
  // "Error" toast on top of the restriction card. Skipping the request when the
  // page is already known to be restricted removes the toast without weakening
  // the entitlement (the backend still enforces it).
  const { isAllowed } = useEntitlements();
  const canUseTemplates = isAllowed("prescription_templates");

  const [templates, setTemplates] = useState<SavedTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<SavedTemplate | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    // Restricted page: the restriction card already explains the state, so no
    // request is made and no error toast is produced.
    if (!canUseTemplates) {
      setTemplates([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.get<any>(API_ROUTES.TEMPLATES.LIST);
      setTemplates(res.data?.data || res.data || []);
    } catch (e: any) {
      showError(e?.response?.data?.message || "Failed to load templates");
      setTemplates([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUseTemplates]);

  // Templates are workspace-scoped on the backend, so a chamber change must
  // refetch — otherwise the previous scope's templates would linger.
  useEffect(() => {
    void load();
  }, [load, activeChamberId]);

  const handleDelete = async (tpl: SavedTemplate) => {
    const ok = await confirm({
      title: `Delete "${tpl.name}"?`,
      description:
        "This removes the saved template. Prescriptions already created from it are not affected.",
      confirmLabel: "Delete template",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await apiClient.delete(API_ROUTES.TEMPLATES.DELETE(tpl.id));
      success("Template deleted");
      setTemplates((prev) => prev.filter((t) => t.id !== tpl.id));
    } catch (e: any) {
      showError(e?.response?.data?.message || "Failed to delete template");
    }
  };

  const handleSave = async () => {
    if (!editing) return;
    if (!editing.name.trim()) {
      showError("Template name is required");
      return;
    }
    setSaving(true);
    try {
      const res = await apiClient.patch<any>(API_ROUTES.TEMPLATES.GET(editing.id), {
        name: editing.name.trim(),
        description: editing.description ?? "",
        complaints: editing.complaints ?? "",
      });
      const updated = res.data?.data || res.data;
      setTemplates((prev) =>
        prev.map((t) => (t.id === editing.id ? { ...t, ...updated } : t)),
      );
      success("Template updated");
      setEditing(null);
    } catch (e: any) {
      // Never silently create/replace: surface the failure.
      showError(e?.response?.data?.message || "Failed to update template");
    } finally {
      setSaving(false);
    }
  };

  const medicineCount = (tpl: SavedTemplate) =>
    Array.isArray(tpl.medicinesJson) ? tpl.medicinesJson.length : 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Link
            href="/dashboard/prescriptions"
            className="mb-1 inline-flex items-center gap-1 text-xs font-semibold text-on-surface-variant hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Prescriptions
          </Link>
          <h1 className="text-2xl font-bold text-on-surface">Saved Templates</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Reusable prescriptions you can apply to a new prescription. Saved per
            workspace.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="mr-1 h-4 w-4" /> Refresh
          </Button>
          {/* Creating a template needs medicines, so it happens in the builder
              (where the medicine editor lives) rather than duplicating it here. */}
          <Link
            href="/dashboard/prescriptions?new=1"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-on-primary transition-colors hover:bg-primary-container hover:text-on-primary-container h-8"
          >
            <Plus className="h-4 w-4" /> New prescription
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-outline-variant bg-surface p-4">
        <p className="text-xs text-on-surface-variant">
          Saving works from the prescription builder: fill in the medicines and
          use <span className="font-semibold text-on-surface">Save as template</span>,
          then apply it to any future prescription from the template selector.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-on-surface-variant">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading templates…
        </div>
      ) : templates.length === 0 ? (
        <div className="rounded-2xl border border-outline-variant bg-surface px-6 py-16 text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 text-on-surface-variant opacity-40" />
          <p className="text-sm font-medium text-on-surface">
            No saved templates yet.
          </p>
          <p className="mt-1 text-xs text-on-surface-variant">
            Open the prescription builder, add medicines and choose “Save as
            template”.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-outline-variant bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead className="bg-surface-container text-xs text-on-surface-variant">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold">Template</th>
                  <th className="px-5 py-3 text-left font-semibold">Medicines</th>
                  <th className="px-5 py-3 text-left font-semibold">Updated</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((tpl) => (
                  <tr
                    key={tpl.id}
                    className="border-t border-outline-variant/40 hover:bg-surface-container/30"
                  >
                    <td className="px-5 py-3">
                      <p className="font-semibold text-on-surface">{tpl.name}</p>
                      {tpl.description ? (
                        <p className="text-xs text-on-surface-variant">
                          {tpl.description}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-5 py-3 text-on-surface-variant">
                      {medicineCount(tpl)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-on-surface-variant">
                      {tpl.updatedAt ? formatDateTime(tpl.updatedAt) : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditing({ ...tpl })}
                          title="Edit"
                          className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(tpl)}
                          title="Delete"
                          className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setEditing(null)}
          />
          <div className="relative z-10 max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-outline-variant bg-surface p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-on-surface">
                Edit Template
              </h2>
              <button
                onClick={() => setEditing(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant">
                  Template name *
                </label>
                <Input
                  value={editing.name}
                  onChange={(e) =>
                    setEditing((p) => (p ? { ...p, name: e.target.value } : p))
                  }
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant">
                  Description
                </label>
                <Input
                  value={editing.description ?? ""}
                  onChange={(e) =>
                    setEditing((p) =>
                      p ? { ...p, description: e.target.value } : p,
                    )
                  }
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant">
                  Complaints
                </label>
                <Textarea
                  rows={3}
                  value={editing.complaints ?? ""}
                  onChange={(e) =>
                    setEditing((p) =>
                      p ? { ...p, complaints: e.target.value } : p,
                    )
                  }
                />
              </div>
              <p className="text-[11px] text-on-surface-variant">
                Medicines are edited in the prescription builder and re-saved as
                a template, so the medicine list here is never silently replaced.
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                variant="ghost"
                onClick={() => setEditing(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : null}
                {saving ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
