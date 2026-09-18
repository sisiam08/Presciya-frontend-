// src/app/(CommonLayout)/login/page.tsx
"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, ShieldCheck, Zap, Activity } from "lucide-react";

export default function LoginPage() {
  const { login, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      // Support a deep-link return target (e.g. an invitation accept page).
      const redirect =
        new URLSearchParams(window.location.search).get("redirect") ||
        undefined;
      await login(email, password, redirect);
      // Otherwise redirect is handled inside useAuth.login() based on systemRole
    } catch (err: any) {
      setError(err?.response?.data?.message || "Login failed. Please check credentials.");
    }
  };

  return (
    <main className="flex min-h-screen bg-surface transition-colors duration-300">
      {/* Left Column: Brand Illustration Section */}
      <section className="hidden lg:flex lg:w-1/2 clinical-gradient relative items-center justify-center p-12 overflow-hidden text-on-primary select-none">
        {/* Decorative atmospheric elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-125 h-125 rounded-full bg-white blur-[120px]"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-125 h-125 rounded-full bg-secondary-fixed blur-[100px]"></div>
        </div>

        <div className="relative z-10 max-w-lg">
          <div className="mb-stack-lg">
            <span className="font-headline-md text-headline-md font-black tracking-tighter text-white">
              Presciya
            </span>
            <div className="h-1 w-12 bg-secondary-fixed mt-2 rounded-full"></div>
          </div>
          <h1 className="font-display-lg text-display-lg mb-stack-md leading-tight text-white">
            Precision medicine starts here.
          </h1>
          <p className="font-body-lg text-body-lg opacity-80 mb-stack-lg text-white">
            A high-performance digital prescription ecosystem designed for Bangladesh&apos;s leading healthcare professionals. Experience surgical clarity and instantaneous speed.
          </p>

          <div className="relative mt-12">
            <img
              alt="Medical Dashboard Visualization"
              className="rounded-xl soft-elevation border border-white/20 shadow-2xl"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC3C7dpifIXXHT4u_Oj5hk8LOGsgt-IfCxM2yKM_pYU5Ei7oLXmx3NhPZcRDeYu7tOGDblpTeoGpXIYVpuuB04mVlRsIFDY9U9X-JsW23uQpxwoPh_NFNlmCFjVn8VcjQQ6B_XHK94dlH51TDevODGonncxV765CTOa_LPUy7uvpps5cGMd677bvihB3a2ZhY9NcWcEFj37c9M-ansPdirfeYtUfJi5vyf1chyDxwqbiIxt2GvrKFxk0fhoUQhN9Qd90Xj__CE9FErJ"
            />
            {/* Floating Stat Chip */}
            <div className="absolute -bottom-6 -right-6 bg-surface-container-lowest p-stack-md rounded-xl shadow-xl flex items-center gap-3 border border-outline-variant text-on-surface">
              <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
                <Zap size={20} className="fill-current" />
              </div>
              <div>
                <p className="font-label-sm text-[10px] text-outline uppercase tracking-wider">
                  System Latency
                </p>
                <p className="font-label-md text-label-md text-on-surface font-bold">
                  &lt; 40ms
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-12 left-12 flex gap-gutter opacity-60 text-xs font-semibold uppercase tracking-wider text-white">
          <p>ISO 27001 Certified</p>
          <p>HIPAA Compliant</p>
        </div>
      </section>

      {/* Right Column: Login Form Section */}
      <section className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-surface dark:bg-slate-950">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-stack-lg text-center">
            <span className="font-headline-md text-headline-md font-black text-primary tracking-tighter">
              Presciya
            </span>
          </div>

          <div className="space-y-2">
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-black">
              Welcome Back
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Access your medical enterprise dashboard
            </p>
          </div>

          {error && (
            <div className="p-4 bg-error-container/30 border border-error/20 text-error rounded-xl text-sm font-semibold flex items-center gap-2">
              <Activity size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Identity Provider Login */}
          <div className="grid grid-cols-1">
            <Button
              type="button"
              variant="outline"
              disabled
              title="Hospital chamber SSO is not available yet"
              className="flex items-center justify-center gap-stack-md bg-surface-container-lowest border border-outline-variant py-6 rounded-xl font-label-md text-label-md text-on-surface opacity-60 cursor-not-allowed"
            >
              <ShieldCheck className="text-primary h-5 w-5" />
              <span>Login via Hospital Chamber (coming soon)</span>
            </Button>
          </div>

          <div className="relative flex items-center py-stack-md">
            <div className="grow border-t border-outline-variant/60"></div>
            <span className="shrink mx-4 font-label-sm text-[10px] text-outline uppercase tracking-widest">
              or email
            </span>
            <div className="grow border-t border-outline-variant/60"></div>
          </div>

          {/* Standard Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-label-md text-label-md text-on-surface-variant ml-1">
                Professional Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-outline h-5 w-5" />
                <Input
                  id="email"
                  type="email"
                  placeholder="doctor@presciya.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-6 bg-surface-container-lowest border border-outline-variant rounded-xl font-body-md text-body-md focus-visible:ring-primary focus-visible:border-primary transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <Label htmlFor="password" className="font-label-md text-label-md text-on-surface-variant">
                  Security Password
                </Label>
                <a href="#" className="font-label-sm text-[12px] text-primary hover:underline font-semibold">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-outline h-5 w-5" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-6 bg-surface-container-lowest border border-outline-variant rounded-xl font-body-md text-body-md focus-visible:ring-primary focus-visible:border-primary transition-all"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2 px-1">
              <input
                id="remember"
                type="checkbox"
                className="w-4 h-4 rounded text-primary border-outline-variant focus:ring-primary dark:bg-slate-900"
              />
              <Label htmlFor="remember" className="font-label-md text-label-md text-on-surface-variant cursor-pointer select-none">
                Stay logged in for 12 hours
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary-container text-on-primary py-6 rounded-xl font-label-md text-label-md font-bold transition-all shadow-md mt-4 h-12"
              disabled={loading}
            >
              {loading ? "Authenticating Securely..." : "Authenticate Securely"}
            </Button>
          </form>

          <footer className="mt-stack-lg text-center space-y-6">
            <p className="font-body-md text-body-md text-on-surface-variant">
              New to Presciya?{" "}
              <a href="/signup" className="text-primary font-bold hover:underline">
                Request Institution Access
              </a>
            </p>
            <div className="flex justify-center gap-stack-lg pt-6 border-t border-outline-variant/30 text-xs font-medium text-outline">
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-primary transition-colors">Support</a>
            </div>
          </footer>
        </div>
      </section>
    </main>
  );
}
