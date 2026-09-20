"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/constants";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiClient.post(API_ROUTES.AUTH.FORGOT_PASSWORD, { email });
      setSent(true);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Could not send the reset email. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <span className="text-xl font-black tracking-tighter text-primary">
            Presciya
          </span>
        </div>

        {sent ? (
          <div className="rounded-2xl border border-outline-variant bg-surface p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <CheckCircle className="h-6 w-6" />
            </div>
            <h1 className="text-lg font-bold text-on-surface">
              Check your email
            </h1>
            <p className="mt-2 text-sm text-on-surface-variant">
              If an account exists for <strong>{email}</strong>, we&apos;ve sent a
              password reset link.
            </p>
            <Link href="/login" className="mt-6 inline-block">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to login
              </Button>
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-outline-variant bg-surface p-8">
            <h1 className="text-lg font-bold text-on-surface">
              Reset your password
            </h1>
            <p className="mt-1 text-sm text-on-surface-variant">
              Enter your account email and we&apos;ll send a reset link.
            </p>

            {error && (
              <div className="mt-4 rounded-xl border border-error/20 bg-error-container/30 p-3 text-sm font-semibold text-error">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <Label htmlFor="email" className="text-on-surface-variant">
                  Email
                </Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@presciya.com"
                    className="pl-11"
                  />
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Sending…" : "Send reset link"}
              </Button>
            </form>

            <Link
              href="/login"
              className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to login
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
