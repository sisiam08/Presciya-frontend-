"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ShieldCheck, ShieldX, Loader2, CalendarDays, Stethoscope, Building2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/constants";

interface VerifyResult {
  verified: boolean;
  prescriptionId: string;
  serialNumber?: string | null;
  issuedAt?: string | null;
  nextVisitDate?: string | null;
  doctorName?: string;
  bmdcNumber?: string | null;
  chamberName?: string | null;
}

const fmtDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—";

export default function VerifyPrescriptionPage() {
  const params = useParams<{ code: string }>();
  const code = params?.code;

  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    let active = true;
    const verify = async () => {
      try {
        const res = await apiClient.get<any>(API_ROUTES.PRESCRIPTIONS.VERIFY(code));
        if (active) setResult(res.data?.data || res.data);
      } catch (e: any) {
        if (active)
          setError(
            e?.response?.data?.message ||
              "No authentic finalized prescription was found for this code.",
          );
      } finally {
        if (active) setLoading(false);
      }
    };
    verify();
    return () => {
      active = false;
    };
  }, [code]);

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-6 py-16 bg-surface">
      <div className="w-full max-w-lg">
        {loading && (
          <div className="flex flex-col items-center gap-3 py-16 text-on-surface-variant">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <p>Verifying prescription…</p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center dark:border-rose-900/40 dark:bg-rose-950/20">
            <ShieldX className="mx-auto mb-3 h-12 w-12 text-rose-500" />
            <h1 className="text-xl font-black text-rose-700 dark:text-rose-400">
              Verification Failed
            </h1>
            <p className="mt-2 text-sm text-rose-600/80 dark:text-rose-300/80">
              {error}
            </p>
          </div>
        )}

        {!loading && !error && result && (
          <div className="overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-sm">
            <div className="flex items-center gap-3 border-b border-outline-variant bg-emerald-50 p-5 dark:bg-emerald-950/20">
              <ShieldCheck className="h-9 w-9 text-emerald-600" />
              <div>
                <h1 className="text-lg font-black text-emerald-700 dark:text-emerald-400">
                  Prescription Verified
                </h1>
                <p className="text-xs text-emerald-600/80 dark:text-emerald-300/80">
                  This is an authentic Presciya digital record.
                </p>
              </div>
            </div>

            <dl className="divide-y divide-outline-variant/50 text-sm">
              <Row icon={<Stethoscope className="h-4 w-4" />} label="Doctor" value={result.doctorName || "—"} />
              {result.bmdcNumber && <Row label="BMDC Reg No" value={result.bmdcNumber} />}
              <Row icon={<Building2 className="h-4 w-4" />} label="Chamber" value={result.chamberName || "—"} />
              {result.serialNumber && <Row label="Prescription No" value={result.serialNumber} />}
              <Row icon={<CalendarDays className="h-4 w-4" />} label="Issued" value={fmtDate(result.issuedAt)} />
              <Row label="Next Visit" value={fmtDate(result.nextVisitDate)} />
            </dl>

            <p className="border-t border-outline-variant/50 p-4 text-center text-[11px] text-on-surface-variant">
              Only non-sensitive verification details are shown. Patient medical
              information is never displayed publicly.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3">
      <dt className="flex items-center gap-2 text-on-surface-variant">
        {icon}
        {label}
      </dt>
      <dd className="text-right font-semibold text-on-surface">{value}</dd>
    </div>
  );
}
