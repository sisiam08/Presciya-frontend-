// src/components/layout/Footer.tsx
import Link from "next/link";
import { Stethoscope, Globe, MessageCircle, X } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1 space-y-4">
            <div className="flex items-center gap-2 text-2xl font-black text-primary dark:text-blue-400 tracking-tighter">
              <Stethoscope className="h-6 w-6 text-primary dark:text-blue-400" />
              <span>Presciya</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs">
              Precision in every prescription. Built for the healthcare professionals of tomorrow.
            </p>
            <div className="flex gap-3">
              <span className="p-2 bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-primary rounded-full cursor-pointer transition-colors">
                <Globe className="h-4 w-4" />
              </span>
              <span className="p-2 bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-primary rounded-full cursor-pointer transition-colors">
                <X className="h-4 w-4" />
              </span>
              <span className="p-2 bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-primary rounded-full cursor-pointer transition-colors">
                <MessageCircle className="h-4 w-4" />
              </span>
            </div>
          </div>

          <div>
            <h5 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">
              Product
            </h5>
            <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
              <li className="hover:text-primary dark:hover:text-blue-400 cursor-pointer transition-colors">
                <Link href="/#features">Features</Link>
              </li>
              <li className="hover:text-primary dark:hover:text-blue-400 cursor-pointer transition-colors">
                <Link href="/#pricing">Pricing</Link>
              </li>
              <li className="hover:text-primary dark:hover:text-blue-400 cursor-pointer transition-colors">
                <Link href="/#workflow">Workflow</Link>
              </li>
              <li className="hover:text-primary dark:hover:text-blue-400 cursor-pointer transition-colors">
                <Link href="/demo">Live Demo</Link>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">
              Company
            </h5>
            <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
              <li className="hover:text-primary dark:hover:text-blue-400 cursor-pointer transition-colors">
                About Us
              </li>
              <li className="hover:text-primary dark:hover:text-blue-400 cursor-pointer transition-colors">
                Careers
              </li>
              <li className="hover:text-primary dark:hover:text-blue-400 cursor-pointer transition-colors">
                Blog
              </li>
              <li className="hover:text-primary dark:hover:text-blue-400 cursor-pointer transition-colors">
                Legal
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">
              Support
            </h5>
            <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
              <li className="hover:text-primary dark:hover:text-blue-400 cursor-pointer transition-colors">
                Help Center
              </li>
              <li className="hover:text-primary dark:hover:text-blue-400 cursor-pointer transition-colors">
                Security
              </li>
              <li className="hover:text-primary dark:hover:text-blue-400 cursor-pointer transition-colors">
                <Link href="/privacy">Privacy Policy</Link>
              </li>
              <li className="hover:text-primary dark:hover:text-blue-400 cursor-pointer transition-colors">
                <Link href="/terms">Terms of Service</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 pt-6 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500 dark:text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} Presciya. All rights reserved. Precision in every prescription.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-primary dark:hover:text-blue-400 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-primary dark:hover:text-blue-400 transition-colors">
              Terms of Service
            </Link>
            <span className="hover:text-primary dark:hover:text-blue-400 cursor-pointer transition-colors">
              Security
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
