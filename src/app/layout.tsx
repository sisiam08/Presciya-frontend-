// src/app/layout.tsx
import "./globals.css";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AuthProvider } from "@/hooks/useAuth";
import { Toaster } from "@/components/ui/toaster";
import { ConfirmProvider } from "@/components/ui/confirm";

/**
 * Self-hosted Inter via `next/font`. This replaces the external
 * `<link href="https://fonts.googleapis.com/...">` request: the font is
 * downloaded at build time and served from our own origin, so it is no longer a
 * render-blocking third-party request and it cannot cause a layout shift
 * (`adjustFontFallback` matches the fallback metrics).
 */
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata = {
  title: "Presciya – Digital Prescription",
  description:
    "Premium digital prescription platform for Bangladeshi doctors and institutions",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body
        className="min-h-screen flex flex-col antialiased bg-background text-on-background"
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem={true}
        >
          <AuthProvider>
            <ConfirmProvider>
              <main className="flex-1 flex flex-col">{children}</main>
              <Toaster />
            </ConfirmProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
