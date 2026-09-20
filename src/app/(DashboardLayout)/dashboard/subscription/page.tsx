"use client";

import React, { useState, useEffect } from "react";
import {
  Award,
  Calendar,
  CheckCircle,
  CreditCard,
  RefreshCw,
  Loader2,
  Tag,
  AlertTriangle,
  XCircle,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { useNotification } from "@/hooks/useNotification";
import { useConfirm } from "@/components/ui/confirm";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-outline-variant/30 ${className}`} />;
}

export default function SubscriptionPage() {
  const { success, error: showError } = useNotification();
  const confirm = useConfirm();
  const [subscription, setSubscription] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [billingHistory, setBillingHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [voucher, setVoucher] = useState("");
  const [voucherResult, setVoucherResult] = useState<any>(null);
  const [validatingVoucher, setValidatingVoucher] = useState(false);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [subRes, plansRes, billingRes] = await Promise.all([
        apiClient.get<any>(API_ROUTES.SUBSCRIPTION.MY_SUBSCRIPTION).catch(() => ({ data: null })),
        apiClient.get<any>(API_ROUTES.SUBSCRIPTION.PLANS).catch(() => ({ data: [] })),
        apiClient.get<any>(API_ROUTES.SUBSCRIPTION.BILLING_HISTORY).catch(() => ({ data: [] })),
      ]);
      // /subscription/my-subscription returns { subscription, usage }.
      const subPayload = subRes.data?.data ?? subRes.data;
      setSubscription(
        subPayload?.subscription
          ? {
              ...subPayload.subscription,
              dailyUsed: subPayload.usage?.today,
              dailyLimit: subPayload.usage?.dailyLimit,
            }
          : subPayload,
      );
      setPlans(plansRes.data?.data || plansRes.data || []);
      setBillingHistory(billingRes.data?.data || billingRes.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const validateVoucher = async () => {
    if (!voucher.trim()) return;
    setValidatingVoucher(true);
    setVoucherResult(null);
    try {
      const res = await apiClient.post<any>(API_ROUTES.SUBSCRIPTION.VALIDATE_VOUCHER, { code: voucher });
      setVoucherResult(res.data?.data || res.data);
      success("Voucher is valid!");
    } catch (e: any) {
      setVoucherResult({ error: e?.response?.data?.message || "Invalid voucher code" });
    }
    setValidatingVoucher(false);
  };

  const handleSubscribe = async (variantId: string) => {
    setSubscribing(variantId);
    try {
      await apiClient.post(API_ROUTES.SUBSCRIPTION.SUBSCRIBE, {
        subscriptionVariantId: variantId,
        ...(voucherResult?.code && { voucherCode: voucherResult.code }),
      });
      success("Subscription updated successfully!");
      loadAll();
    } catch (e: any) {
      showError(e?.response?.data?.message || "Failed to subscribe.");
    }
    setSubscribing(null);
  };

  const handleCancel = async () => {
    const ok = await confirm({
      title: "Cancel your subscription?",
      description:
        "You can still use the plan until the current billing period ends.",
      confirmLabel: "Cancel subscription",
      variant: "danger",
    });
    if (!ok) return;
    setCancelling(true);
    try {
      await apiClient.post(API_ROUTES.SUBSCRIPTION.CANCEL);
      success("Subscription cancelled.");
      loadAll();
    } catch (e: any) {
      showError(e?.response?.data?.message || "Failed to cancel subscription.");
    }
    setCancelling(false);
  };

  const currentVariantId = subscription?.subscriptionVariant?.id;
  const isExpired = subscription?.expiryDate ? new Date(subscription.expiryDate) < new Date() : false;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Subscription & Billing</h1>
          <p className="text-sm text-on-surface-variant">Manage your plan, billing, and usage quotas</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadAll}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      {/* Expiry warning (3 days before + at/after expiry) */}
      {!loading && subscription?.expiryDate && (() => {
        const expiry = new Date(subscription.expiryDate);
        const daysLeft = Math.ceil(
          (expiry.getTime() - Date.now()) / 86_400_000,
        );
        if (daysLeft > 3) return null;
        const expired = daysLeft <= 0;
        return (
          <div
            className={`flex items-start gap-3 rounded-2xl border p-4 ${
              expired
                ? "border-red-300 bg-red-50 dark:border-red-900/40 dark:bg-red-950/20"
                : "border-amber-300 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20"
            }`}
          >
            <AlertTriangle
              className={`h-5 w-5 shrink-0 ${expired ? "text-red-600" : "text-amber-600"}`}
            />
            <div>
              <p
                className={`text-sm font-bold ${
                  expired ? "text-red-700 dark:text-red-400" : "text-amber-700 dark:text-amber-400"
                }`}
              >
                {expired
                  ? "Your subscription has expired"
                  : `Your subscription expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`}
              </p>
              <p className="mt-0.5 text-xs text-on-surface-variant">
                {expired
                  ? "Premium features (appointments, finance) are now disabled. Your data is safe — renew to restore access."
                  : `Expires on ${formatDate(subscription.expiryDate)}. Renew to keep premium features.`}
              </p>
            </div>
          </div>
        );
      })()}

      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-40" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
          </div>
        </div>
      ) : (
        <>
          {/* Current Plan Banner */}
          {subscription ? (
            <div className={`rounded-2xl p-6 border ${isExpired ? "bg-red-50 border-red-200" : "bg-primary/5 border-primary/20"}`}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${isExpired ? "bg-red-100" : "bg-primary/10"}`}>
                    <Award className={`h-6 w-6 ${isExpired ? "text-red-600" : "text-primary"}`} />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-on-surface">
                      {subscription.subscriptionVariant?.variantName || "Active Plan"}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Expires: {formatDate(subscription.expiryDate)}
                      </span>
                      <span className={`flex items-center gap-1 font-semibold ${
                        isExpired ? "text-red-600" : subscription.isActive ? "text-emerald-600" : "text-gray-500"
                      }`}>
                        {isExpired ? (
                          <><AlertTriangle className="h-3.5 w-3.5" /> Expired</>
                        ) : subscription.isActive ? (
                          <><CheckCircle className="h-3.5 w-3.5" /> Active</>
                        ) : (
                          <><XCircle className="h-3.5 w-3.5" /> Inactive</>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
                {subscription.isActive && !isExpired && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={handleCancel}
                    disabled={cancelling}
                  >
                    {cancelling ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                    Cancel Subscription
                  </Button>
                )}
              </div>

              {/* Usage progress */}
              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                {subscription.dailyUsed != null && subscription.dailyLimit != null && (
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-semibold text-on-surface">Daily Prescriptions</span>
                      <span className="text-on-surface-variant">{subscription.dailyUsed} / {subscription.dailyLimit}</span>
                    </div>
                    <div className="h-2 w-full bg-outline-variant rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${Math.min((subscription.dailyUsed / subscription.dailyLimit) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-outline-variant bg-surface p-6 text-center">
              <Award className="h-10 w-10 mx-auto mb-3 text-on-surface-variant/30" />
              <p className="text-sm font-medium text-on-surface">No active subscription</p>
              <p className="text-xs text-on-surface-variant mt-1">Choose a plan below to get started</p>
            </div>
          )}

          {/* Voucher */}
          <div className="rounded-2xl border border-outline-variant bg-surface p-5">
            <h2 className="text-sm font-semibold text-on-surface mb-3 flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" /> Apply Voucher Code
            </h2>
            <div className="flex gap-2">
              <Input
                placeholder="VOUCHER2024"
                value={voucher}
                onChange={(e) => setVoucher(e.target.value.toUpperCase())}
                className="flex-1"
              />
              <Button size="sm" onClick={validateVoucher} disabled={validatingVoucher}>
                {validatingVoucher ? <Loader2 className="h-4 w-4 animate-spin" /> : "Validate"}
              </Button>
            </div>
            {voucherResult && (
              <p className={`text-xs mt-2 ${voucherResult.error ? "text-red-600" : "text-emerald-600"}`}>
                {voucherResult.error || `✓ ${voucherResult.discountPercentage ?? 0}% discount applied`}
              </p>
            )}
          </div>

          {/* Plan cards */}
          {plans.length > 0 && (
            <div>
              <h2 className="text-base font-semibold text-on-surface mb-4">Available Plans</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {plans.map((plan: any) => {
                  const isCurrent = plan.id === currentVariantId;
                  return (
                    <div
                      key={plan.id}
                      className={`rounded-2xl border p-6 flex flex-col relative overflow-hidden ${
                        isCurrent
                          ? "border-primary bg-primary/5 ring-2 ring-primary ring-offset-2"
                          : "border-outline-variant bg-surface"
                      }`}
                    >
                      {isCurrent && (
                        <span className="absolute top-3 right-3 text-[10px] font-bold bg-primary text-on-primary px-2 py-0.5 rounded-full uppercase">
                          Current
                        </span>
                      )}
                      <div className="mb-4">
                        <p className="text-base font-bold text-on-surface">{plan.variantName}</p>
                        <div className="flex items-baseline gap-1 mt-2">
                          <span className="text-3xl font-extrabold text-on-surface">৳{plan.price}</span>
                          <span className="text-xs text-on-surface-variant">/month</span>
                        </div>
                        {voucherResult && !voucherResult.error && (
                          <p className="text-xs text-emerald-600 font-medium mt-1">
                            After discount: ৳{(plan.price * (1 - (voucherResult.discountPercentage || 0) / 100)).toFixed(0)}
                          </p>
                        )}
                      </div>

                      <ul className="space-y-2 flex-1 mb-6">
                        {plan.dailyPrescriptionLimit && (
                          <li className="flex items-center gap-2 text-xs text-on-surface">
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                            {plan.dailyPrescriptionLimit} daily prescriptions
                          </li>
                        )}
                        {(Array.isArray(plan.description) ? plan.description : []).map((feat: string, i: number) => (
                          <li key={i} className="flex items-center gap-2 text-xs text-on-surface">
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                            {feat}
                          </li>
                        ))}
                      </ul>

                      <Button
                        className={`w-full ${isCurrent ? "opacity-50 cursor-not-allowed" : ""}`}
                        variant={isCurrent ? "outline" : "primary"}
                        disabled={isCurrent || !!subscribing}
                        onClick={() => !isCurrent && handleSubscribe(plan.id)}
                      >
                        {subscribing === plan.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : null}
                        {isCurrent ? "Current Plan" : "Subscribe"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Billing History */}
          {billingHistory.length > 0 && (
            <div className="rounded-2xl border border-outline-variant bg-surface overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 border-b border-outline-variant">
                <CreditCard className="h-5 w-5 text-primary" />
                <h2 className="text-base font-semibold text-on-surface">Billing History</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-surface-container border-b border-outline-variant">
                    <tr>
                      {["Invoice", "Amount", "Status", "Date"].map((h) => (
                        <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-on-surface-variant">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {billingHistory.map((inv: any) => (
                      <tr key={inv.id} className="border-b border-outline-variant last:border-0 hover:bg-surface-container/30">
                        <td className="py-3 px-4 font-mono text-xs text-on-surface">{inv.invoiceNumber}</td>
                        <td className="py-3 px-4 text-sm font-semibold text-on-surface">৳{inv.amount}</td>
                        <td className="py-3 px-4">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            inv.status === "PAID"
                              ? "bg-emerald-50 text-emerald-600"
                              : inv.status === "OVERDUE"
                              ? "bg-red-50 text-red-600"
                              : "bg-gray-100 text-gray-600"
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-on-surface-variant">
                          {formatDate(inv.issuedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
