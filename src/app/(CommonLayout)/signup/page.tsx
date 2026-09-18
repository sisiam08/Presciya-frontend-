"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import api from "@/lib/api";
import { Mail, Lock, User, Sparkles, Zap, KeyRound, Building2, Stethoscope, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState<"DOCTOR" | "INSTITUTION">("DOCTOR");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  // Step 1: Request OTP
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast({ title: "Name is required", variant: "destructive" });
    if (!email.trim()) return toast({ title: "Email is required", variant: "destructive" });
    if (password.length < 8) return toast({ title: "Password must be at least 8 characters", variant: "destructive" });

    setLoading(true);
    try {
      await api.post("/auth/sendOTP", { name, email });
      toast({
        title: "Verification Code Sent",
        description: `We sent a 6-digit OTP code to ${email}.`,
        variant: "success",
      });
      setStep(2);
    } catch (err: any) {
      toast({
        title: "Failed to Send OTP",
        description: err?.response?.data?.message || err.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Submit Signup with OTP
  const handleCompleteSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || otp.length !== 6) {
      return toast({ title: "OTP Code Required", description: "Please enter the 6-digit code sent to your email.", variant: "destructive" });
    }

    setLoading(true);
    try {
      await api.post("/auth/signup", {
        name,
        email,
        password,
        accountType,
        OTP: otp.trim(),
      });
      toast({
        title: "Account Created!",
        description: "Your registration was successful. Please sign in now.",
        variant: "success",
      });
      router.push("/login");
    } catch (err: any) {
      toast({
        title: "Registration Failed",
        description: err?.response?.data?.message || err.message || "An error occurred during signup",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen bg-surface transition-colors duration-300">
      {/* Left Column: Brand Illustration */}
      <section className="hidden lg:flex lg:w-1/2 clinical-gradient relative items-center justify-center p-12 overflow-hidden text-on-primary select-none">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-125 h-125 rounded-full bg-white blur-[120px]"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-100 h-100 rounded-full bg-secondary-fixed blur-[100px]"></div>
        </div>

        <div className="relative z-10 max-w-lg">
          <div className="mb-8">
            <span className="font-headline-md text-headline-md font-black tracking-tighter text-white">
              Presciya
            </span>
            <div className="h-1 w-12 bg-secondary-fixed mt-2 rounded-full"></div>
          </div>
          <h1 className="font-display-lg text-display-lg mb-6 leading-tight text-white">
            Precision medicine starts here.
          </h1>
          <p className="font-body-lg text-body-lg opacity-80 mb-8 text-white">
            A high-performance digital prescription ecosystem designed for healthcare professionals in Bangladesh. Experience surgical clarity and instantaneous speed.
          </p>

          <div className="relative mt-8">
            <img
              alt="Medical Dashboard Visualization"
              className="rounded-xl soft-elevation border border-white/20 shadow-2xl"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC3C7dpifIXXHT4u_Oj5hk8LOGsgt-IfCxM2yKM_pYU5Ei7oLXmx3NhPZcRDeYu7tOGDblpTeoGpXIYVpuuB04mVlRsIFDY9U9X-JsW23uQpxwoPh_NFNlmCFjVn8VcjQQ6B_XHK94dlH51TDevODGonncxV765CTOa_LPUy7uvpps5cGMd677bvihB3a2ZhY9NcWcEFj37c9M-ansPdirfeYtUfJi5vyf1chyDxwqbiIxt2GvrKFxk0fhoUQhN9Qd90Xj__CE9FErJ"
            />
            <div className="absolute -bottom-6 -right-6 bg-surface-container-lowest p-4 rounded-xl shadow-xl flex items-center gap-3 border border-outline-variant text-on-surface">
              <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
                <Zap size={20} className="fill-current" />
              </div>
              <div>
                <p className="text-[10px] text-outline uppercase tracking-wider font-semibold">
                  System Latency
                </p>
                <p className="text-sm text-on-surface font-bold">
                  &lt; 40ms
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-12 left-12 flex gap-6 opacity-60 text-xs font-semibold uppercase tracking-wider text-white">
          <p>ISO 27001 Certified</p>
          <p>HIPAA Compliant</p>
        </div>
      </section>

      {/* Right Column: Signup Form */}
      <section className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-surface dark:bg-slate-950">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-4">
            <span className="text-2xl font-black text-primary tracking-tighter">
              Presciya
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${step === 1 ? "bg-primary/10 text-primary" : "bg-emerald-50 text-emerald-700"}`}>
                Step {step} of 2
              </span>
              <span className="text-xs text-on-surface-variant">
                {step === 1 ? "Account Setup" : "Email Verification"}
              </span>
            </div>
            <h2 className="text-2xl font-black text-on-surface">
              {step === 1 ? "Create an Account" : "Verify Your Email"}
            </h2>
            <p className="text-sm text-on-surface-variant mt-1">
              {step === 1
                ? "Register your professional practice securely"
                : `Enter the 6-digit code sent to ${email}`}
            </p>
          </div>

          {/* STEP 1: Basic Info Form */}
          {step === 1 && (
            <form onSubmit={handleSendOTP} className="space-y-4">
              {/* Account Type Selection */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-on-surface-variant">Account Type</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAccountType("DOCTOR")}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-semibold ${
                      accountType === "DOCTOR"
                        ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/20"
                        : "border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-primary/50"
                    }`}
                  >
                    <Stethoscope size={20} />
                    <span>Personal Doctor</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountType("INSTITUTION")}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-semibold ${
                      accountType === "INSTITUTION"
                        ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/20"
                        : "border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-primary/50"
                    }`}
                  >
                    <Building2 size={20} />
                    <span>Institution / Clinic</span>
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-semibold text-on-surface-variant">Full Name *</Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline h-4 w-4" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Dr. Abul Kalam"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 h-11 text-sm bg-surface-container-lowest"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-on-surface-variant">Professional Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="doctor@presciya.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 text-sm bg-surface-container-lowest"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold text-on-surface-variant">Security Password (min 8 chars) *</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline h-4 w-4" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-11 text-sm bg-surface-container-lowest"
                    required
                    minLength={8}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 font-bold text-sm mt-2 flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles size={16} />}
                <span>{loading ? "Sending Code..." : "Continue to Verification"}</span>
              </Button>
            </form>
          )}

          {/* STEP 2: OTP Verification Form */}
          {step === 2 && (
            <form onSubmit={handleCompleteSignup} className="space-y-5">
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-1">
                <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> Verification Email Sent
                </p>
                <p className="text-xs text-on-surface-variant">
                  We sent a 6-digit code to <strong>{email}</strong>.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="otp" className="text-xs font-semibold text-on-surface-variant">6-Digit Verification Code (OTP)</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline h-4 w-4" />
                  <Input
                    id="otp"
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    className="pl-10 h-12 text-lg font-mono tracking-widest bg-surface-container-lowest text-center"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 h-11 text-sm font-semibold"
                >
                  <ArrowLeft size={14} className="mr-1" /> Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-11 text-sm font-bold"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  <span>{loading ? "Verifying..." : "Complete Registration"}</span>
                </Button>
              </div>
            </form>
          )}

          <footer className="mt-6 text-center space-y-4 pt-4 border-t border-outline-variant/30">
            <p className="text-xs text-on-surface-variant">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-bold hover:underline">
                Sign In
              </Link>
            </p>
          </footer>
        </div>
      </section>
    </main>
  );
}
