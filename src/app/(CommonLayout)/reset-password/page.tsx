"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/constants";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Read the token from the query string without useSearchParams (avoids the
  // Suspense boundary requirement for a client page).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token") || "");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      return setError("Password must be at least 8 characters long.");
    }
    if (password !== confirm) {
      return setError("Passwords do not match.");
    }
    setLoading(true);
    try {
      await apiClient.post(API_ROUTES.AUTH.RESET_PASSWORD, {
        token,
        newPassword: password,
      });
      setDone(true);
      setTimeout(() => router.push("/login"), 1500);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Could not reset the password. The link may have expired.",
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

        <div className="rounded-2xl border border-outline-variant bg-surface p-8">
          {done ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                <CheckCircle className="h-6 w-6" />
              </div>
              <h1 className="text-lg font-bold text-on-surface">
                Password updated
              </h1>
              <p className="mt-2 text-sm text-on-surface-variant">
                Redirecting you to login…
              </p>
            </div>
          ) : !token ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h1 className="text-lg font-bold text-on-surface">
                Invalid reset link
              </h1>
              <p className="mt-2 text-sm text-on-surface-variant">
                This password reset link is missing or invalid.
              </p>
              <Link href="/forgot-password" className="mt-5 inline-block">
                <Button variant="outline">Request a new link</Button>
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-bold text-on-surface">
                Set a new password
              </h1>
              <p className="mt-1 text-sm text-on-surface-variant">
                Choose a strong password of at least 8 characters.
              </p>

              {error && (
                <div className="mt-4 rounded-xl border border-error/20 bg-error-container/30 p-3 text-sm font-semibold text-error">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div>
                  <Label htmlFor="password" className="text-on-surface-variant">
                    New Password
                  </Label>
                  <div className="relative mt-1.5">
                    <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-11"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="confirm" className="text-on-surface-variant">
                    Confirm Password
                  </Label>
                  <div className="relative mt-1.5">
                    <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
                    <Input
                      id="confirm"
                      type="password"
                      required
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="••••••••"
                      className="pl-11"
                    />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {loading ? "Updating…" : "Update password"}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
