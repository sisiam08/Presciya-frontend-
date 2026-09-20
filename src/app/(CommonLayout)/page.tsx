// src/app/(CommonLayout)/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Play,
  ArrowRight,
  TrendingUp,
  Zap,
  Building2,
  FileText,
  WifiOff,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    // Reveal animation intersection observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("opacity-100", "translate-y-0");
            entry.target.classList.remove("opacity-0", "translate-y-10");
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll(".reveal-section").forEach((el) => {
      el.classList.add(
        "transition-all",
        "duration-1000",
        "opacity-0",
        "translate-y-10"
      );
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="bg-background text-on-background transition-colors duration-300">
      {/* Hero Section */}
      <section className="relative overflow-hidden hero-mesh min-h-[90vh] flex items-center py-20">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-1 lg:grid-cols-2 gap-stack-lg items-center">
          <div className="z-10 text-center lg:text-left space-y-stack-md reveal-section">
            <div className="inline-flex items-center gap-2 bg-primary-fixed text-on-primary-fixed px-4 py-1.5 rounded-full text-label-sm font-label-sm mb-stack-sm">
              <BadgeCheck size={16} className="text-primary" />
              <span>NEW: MULTI-CHAMBER CLOUD SYNC</span>
            </div>
            <h1 className="font-display-lg text-display-lg leading-tight lg:text-[56px] text-on-background">
              Precision Medicine <br className="hidden lg:block" />{" "}
              <span className="text-primary text-glow">Starts Here</span>
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant dark:text-surface-variant max-w-xl mx-auto lg:mx-0">
              The ultimate high-performance digital prescription suite for the modern Bangladeshi doctor. Multi-chamber support, AI-driven autocomplete, and instant professional PDF generation.
            </p>
            <div className="flex flex-col sm:flex-row gap-stack-md pt-stack-sm justify-center lg:justify-start">
              <Link href="/signup">
                <Button size="lg" className="h-14 px-8 rounded-xl text-base font-semibold shadow-md bg-primary text-on-primary hover:opacity-90 active:scale-[0.98] w-full sm:w-auto">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/demo">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-8 rounded-xl text-base font-semibold border-outline-variant hover:bg-surface-container-low active:scale-[0.98] flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <Play size={18} fill="currentColor" />
                  Watch Demo
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-stack-md pt-stack-md justify-center lg:justify-start">
              <div className="flex -space-x-2">
                <img
                  className="w-10 h-10 rounded-full border-2 border-surface shadow-sm"
                  alt="Doctor 1"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDfT3GyKRR-BL1ueiDFVToF1gMB6vMkS3T5kJSGgHztUAX2eh0WLsU4J4TezK3JpC1xgPUvCpjh3loK4hMjTyVRsNf2mr7EneKWnYm5rkOufXeqP5QH3ho98yLescLOvbV8ddgvQEHX_6SGiS_1UhXRwCDPL62Qs9PHDPUcm6ehku-GnA2QHEzFzV5OnY-0w3tmWke-LAuadGMOhoUHKwlKvPeyoB67CtCsRPh_dSyQTMY03VJwo0pXJWv9wYWG3aZGw_W6EHTFlV-p"
                />
                <img
                  className="w-10 h-10 rounded-full border-2 border-surface shadow-sm"
                  alt="Doctor 2"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAZegUlAuxoYHVBYQK3C2xpwvkItUap_12tIrM0CzwXMXbArUVgVQt0C7IJUYwD9edtstRT1NMCL0_UpblPJ2vMPFg10mJ8GUIIwFZGDz2tQ7R1t0Lxgsm7ELNO6HhJSNQsvV5Sc4Gvtj0_taXicZJsh5zzTBW9O9uipTT7K-olsTX728-R9hl3k0eEKR-tS3NQ0CJt8AXdJD7FiciSDFAZlAhHpjohTL0MAD82Q209ddrZM_UvlH-eeXjQTTcJoHhBAOhwtAZ4Zumj"
                />
                <img
                  className="w-10 h-10 rounded-full border-2 border-surface shadow-sm"
                  alt="Doctor 3"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCOp_ootyzOuF4EUhb_2UKfrIF54DNw-RjFo29SfAuo8pF5p72opIFv71gGyWE3edTSHP8OKMbFhGjSSVWi3MYzJxeLR3c1pSN5XAlWvFCGIAJWCMnAt8dQJeHN_DGhSSZDqiF4DB7gpCRs1IFrEXBy4P9gpJzs4rVa1DvLDleFfs_cYgWCUJ_mlizEX63D4609RZo4eyXHJoDZKPsJcfkVANBUolS2DR_9y_4HCokOBge9lJzX2NVnoDri1XL0hPoa0gt67lP5Jscr"
                />
              </div>
              <p className="text-label-md font-label-md text-on-surface-variant">
                Trusted by <span className="font-bold text-on-surface">5,000+ Doctors</span>
              </p>
            </div>
          </div>
          <div className="relative flex justify-center items-center reveal-section">
            <div className="absolute -z-10 w-[120%] h-[120%] bg-primary/5 rounded-full blur-[100px] animate-pulse"></div>
            <img
              alt="Presciya UI Interface"
              className="w-full h-auto drop-shadow-2xl rounded-2xl transform rotate-1 hover:rotate-0 transition-transform duration-700 border border-outline-variant/30"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBVL7CS2XyllnTSLUYJ-g2l3zofBxq3W_y-NwuAwR9XjfigO5l7hGLU9tQZWXxCHDjEQ8CxlR7lutAcFyDRtRJWwo_Uf5-nfgXROy3gBbajiUidRiT2QO0m5xm8zKeIPNrlaing_uZdMys0BL4l-BcAi2UiN67COYBtVCrkBYWIy9LpTh0kI6HeQMlS_oWfQhCJeongqTCPQJnOUEeIcb2U7mw0O6QJXseChWKHbKBj718-Yda4es-mmluFWfnpDYWZwzPIB6AdMO_I"
            />
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-stack-lg bg-surface-container-low/50 border-y border-outline-variant/20">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop text-center">
          <p className="text-label-sm font-label-sm text-outline uppercase tracking-widest mb-stack-md">
            Standardizing care across leading institutions
          </p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            <div className="font-headline-md text-on-surface-variant font-bold">Evercare</div>
            <div className="font-headline-md text-on-surface-variant font-bold">United Hospital</div>
            <div className="font-headline-md text-on-surface-variant font-bold">Apollo Labs</div>
            <div className="font-headline-md text-on-surface-variant font-bold">Square Hospitals</div>
            <div className="font-headline-md text-on-surface-variant font-bold">Labaid</div>
          </div>
        </div>
      </section>

      {/* Feature Showcase (Bento Grid) */}
      <section id="features" className="py-24 scroll-mt-24">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="text-center max-w-2xl mx-auto mb-16 reveal-section">
            <h2 className="font-headline-lg text-headline-lg mb-stack-sm text-on-background">
              Smarter Tools for Sharp Minds
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              We&apos;ve automated the tedious parts of clinical documentation so you can focus on patient care.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-stack-md">
            {/* Analytics Card */}
            <div className="md:col-span-8 glass-card p-8 rounded-2xl flex flex-col justify-between group overflow-hidden border border-outline-variant/30 reveal-section">
              <div>
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-stack-sm">
                  <TrendingUp size={24} />
                </div>
                <h3 className="font-headline-md text-headline-md mb-2 text-on-surface">Practice Insights</h3>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
                  Track patient demographics, disease trends, and medication adherence through intuitive real-time dashboards.
                </p>
              </div>
              <div className="mt-stack-lg relative h-48 bg-surface-container rounded-xl overflow-hidden p-6">
                <div className="flex items-end gap-3 h-full justify-around">
                  {[40, 55, 70, 45, 65].map((height, idx) => (
                    <div
                      key={idx}
                      onMouseEnter={() => setHoveredBar(idx)}
                      onMouseLeave={() => setHoveredBar(null)}
                      className={`w-full bg-primary-container rounded-t-lg transition-all duration-500 cursor-pointer ${
                        idx === 2 ? "bg-primary" : "opacity-80 hover:opacity-100"
                      }`}
                      style={{
                        height: hoveredBar === idx ? "85%" : `${height}%`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Autocomplete Card */}
            <div className="md:col-span-4 bg-tertiary text-on-tertiary p-8 rounded-2xl flex flex-col justify-between hover:scale-[0.98] transition-transform reveal-section">
              <div>
                <div className="w-12 h-12 bg-on-tertiary/20 rounded-xl flex items-center justify-center mb-stack-sm text-on-tertiary">
                  <Zap size={24} />
                </div>
                <h3 className="font-headline-md text-headline-md mb-2">Smart Autocomplete</h3>
                <p className="text-on-tertiary/80 font-body-md">
                  20,000+ medicine database at your fingertips. Just type three letters to see dosage and brand suggestions.
                </p>
              </div>
              <div className="mt-stack-md bg-white/10 rounded-lg p-4 space-y-2">
                <div
                  className="flex items-center justify-between border-b border-white/20 pb-2 cursor-pointer"
                  onClick={() => setShowSuggestions(!showSuggestions)}
                >
                  <span className="text-sm font-medium">Search: Napa...</span>
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded font-mono">Try</span>
                </div>
                <div className="text-xs bg-white/20 p-2.5 rounded font-medium">Napa Extend (665mg)</div>
                <div className="text-xs bg-white/10 p-2.5 rounded opacity-90">Napa Syrup</div>
              </div>
            </div>

            {/* Multi-Chamber */}
            <div className="md:col-span-4 glass-card p-8 rounded-2xl border-l-4 border-secondary border-y border-r border-outline-variant/30 reveal-section">
              <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary mb-4">
                <Building2 size={24} />
              </div>
              <h3 className="font-headline-md text-headline-md mb-2 text-on-surface">Chamber Hub</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Switch seamlessly between Dhaka, Chittagong, and Sylhet clinics with localized letterheads.
              </p>
            </div>

            {/* PDF Generation */}
            <div className="md:col-span-4 glass-card p-8 rounded-2xl border border-outline-variant/30 reveal-section">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4">
                <FileText size={24} />
              </div>
              <h3 className="font-headline-md text-headline-md mb-2 text-on-surface">Instant PDF</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Print, email, or WhatsApp prescriptions instantly in high-resolution vector format.
              </p>
            </div>

            {/* Offline Mode */}
            <div className="md:col-span-4 glass-card p-8 rounded-2xl border border-outline-variant/30 reveal-section">
              <div className="w-12 h-12 bg-error/10 rounded-xl flex items-center justify-center text-error mb-4">
                <WifiOff size={24} />
              </div>
              <h3 className="font-headline-md text-headline-md mb-2 text-on-surface">Always Available</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Work offline in remote areas; data syncs automatically once you&apos;re back online.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Timeline */}
      <section id="workflow" className="py-24 bg-surface-container-highest/20 overflow-hidden scroll-mt-24">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="text-center mb-16 reveal-section">
            <h2 className="font-headline-lg text-headline-lg mb-stack-sm text-on-background">
              Seamless Prescription Workflow
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-xl mx-auto">
              From registration to the pharmacy, Presciya streamlines every touchpoint.
            </p>
          </div>
          <div className="relative">
            {/* Connecting Line */}
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-1 timeline-gradient hidden md:block"></div>
            <div className="space-y-16">
              {/* Step 1 */}
              <div className="relative flex flex-col md:flex-row items-center justify-between reveal-section">
                <div className="md:w-[45%] mb-stack-sm md:mb-0 text-left md:text-right md:pr-10">
                  <h4 className="font-headline-md text-headline-md text-on-surface">Patient Triage</h4>
                  <p className="font-body-md text-on-surface-variant mt-1">
                    Quickly log vitals (BP, Heart Rate, SpO2) via assistant or front desk module.
                  </p>
                </div>
                <div className="absolute left-0 md:left-1/2 transform md:-translate-x-1/2 w-10 h-10 bg-primary text-on-primary rounded-full flex items-center justify-center z-10 border-4 border-background font-bold">
                  1
                </div>
                <div className="md:w-[45%] md:pl-10 w-full">
                  <div className="p-stack-md glass-card rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
                    <img
                      className="w-full h-32 object-cover rounded-xl"
                      alt="Patient Triage Vitals"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuD9R8tU673FgMNGDQQX6GRmE9qxs8NGXWtJrkSoDio75PVAaN32mSEFO-Of_I9-uKZMNIONABdhD6FVADy9u49NMhq4UocYn4dN24oZHiWRQl6ZVXhtRPuZQMpdEr54bLAwG-5BAsjNYBv0FFtHj8_L3qx8FGTZ0ZM3n0gIaiLoIo2D_WVTSJa3TzLqVbZCxb7INC2PfbXxUsc4ou6AhY4HsSywuMWUter2ziHhBc0ya2flchAldsMT2wjgAmMxpLOzsYETpSF3XOlB"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative flex flex-col md:flex-row-reverse items-center justify-between reveal-section">
                <div className="md:w-[45%] mb-stack-sm md:mb-0 text-left md:pl-10">
                  <h4 className="font-headline-md text-headline-md text-on-surface">Consultation</h4>
                  <p className="font-body-md text-on-surface-variant mt-1">
                    Enter symptoms and diagnoses using dictation or smart-templates built for your specialty.
                  </p>
                </div>
                <div className="absolute left-0 md:left-1/2 transform md:-translate-x-1/2 w-10 h-10 bg-tertiary text-on-tertiary rounded-full flex items-center justify-center z-10 border-4 border-background font-bold">
                  2
                </div>
                <div className="md:w-[45%] md:pr-10 w-full">
                  <div className="p-stack-md glass-card rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
                    <img
                      className="w-full h-32 object-cover rounded-xl"
                      alt="Doctor Consultation Setup"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCNQlKMltVKhX2esRQC6VduOT9_K3DKAf8WjbpjFKsUKSKXq-dqCReR8GSKfBphA2HpI6hVuJ-6fVtKbMrW4S7CsgGyqy2HQ5X-Isw7zsw2paxuwFdzcej2VVWzYuP7jehRMuMtODMsvNVvC7jEuEd0IGW9imt9gb_WfEqGqPvXXp4zbhqB46gd9c1XnGaiCuijZ9bD3dYpm36tcNv8tBF9iYrM2ujORTpHawfZ1qchiMWBM_1VjNWuGmUsqXvCTTapibO2GciREKzp"
                    />
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative flex flex-col md:flex-row items-center justify-between reveal-section">
                <div className="md:w-[45%] mb-stack-sm md:mb-0 text-left md:text-right md:pr-10">
                  <h4 className="font-headline-md text-headline-md text-on-surface">Print &amp; Sync</h4>
                  <p className="font-body-md text-on-surface-variant mt-1">
                    Generate a QR-coded prescription that patients can&apos;t forge, synced instantly to their mobile app.
                  </p>
                </div>
                <div className="absolute left-0 md:left-1/2 transform md:-translate-x-1/2 w-10 h-10 bg-secondary text-on-secondary rounded-full flex items-center justify-center z-10 border-4 border-background font-bold">
                  3
                </div>
                <div className="md:w-[45%] md:pl-10 w-full">
                  <div className="p-stack-md glass-card rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
                    <img
                      className="w-full h-32 object-cover rounded-xl"
                      alt="Prescription Laser Printing"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCVa_lnlMsgUXd7p115aGQKYU4ZOULl8gS7hxGXWnvuR3K6D5yibC4ZjdmiLawAsaVIpZs1Fg_2UlUDvG7mgq4JJSF1yrl-7IHgDsDa9EpCDkkXxNijh7FtiZOjho1N9FlX1E8GxyT_HtWwH7zEqtG_gDKnFuyNKb8uE2Css6UF5giyxMxgjsOC82bOFgdfYJjyuRpK19mL8P-X1c8r6IAa7iKlWN390xrCPh0czHXtBFN590JJYdoj04D7YgSajMChWua_QxkQL-Gt"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section id="pricing" className="py-24 px-margin-mobile scroll-mt-24">
        <div className="max-w-4xl mx-auto glass-card p-12 rounded-[2rem] text-center shadow-xl border-2 border-primary/10 relative overflow-hidden reveal-section">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-tertiary/10 rounded-full blur-[80px] -ml-32 -mb-32"></div>
          <h2 className="font-display-lg text-display-lg-mobile md:text-display-lg mb-stack-md relative z-10 text-on-surface">
            Ready to Upgrade Your Practice?
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-stack-lg relative z-10">
            Join thousands of healthcare professionals who trust Presciya for clinical excellence.
          </p>
          <div className="flex flex-col sm:flex-row gap-stack-md justify-center relative z-10 max-w-md mx-auto">
            <Link href="/signup" className="flex-1">
              <Button size="lg" className="w-full h-14 bg-primary text-on-primary font-bold shadow-lg shadow-primary/20 rounded-full hover:opacity-90 transition-all">
                Create Free Account
              </Button>
            </Link>
            <Link href="/demo" className="flex-1">
              <Button size="lg" variant="outline" className="w-full h-14 border-outline hover:bg-surface-container rounded-full text-on-surface font-bold transition-all">
                Book a Sales Demo
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-label-sm font-label-sm text-outline">
            No credit card required. Cancel anytime.
          </p>
        </div>
      </section>
    </div>
  );
}
