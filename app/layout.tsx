import type { Metadata } from "next";
import { Fraunces, Space_Grotesk } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteNav from "@/components/SiteNav";
import SeedProvider from "@/components/SeedProvider";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const grotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-grotesk",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Raktha — Emergency Blood Donor Network",
  description:
    "Raktha connects emergency blood requests with compatible local donors — eligibility screening, donor registry, and request matching.",
};

export const viewport = {
  themeColor: "#f6f1e5",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${grotesk.variable}`}>
      <body className="min-h-screen font-sans">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-[3px] focus:bg-ink focus:px-4 focus:py-2 focus:text-[13px] focus:font-semibold focus:text-cream"
        >
          Skip to content
        </a>
        <SiteHeader />
        <SeedProvider>
          <main id="main-content" className="mx-auto w-full max-w-6xl px-5 pb-28 pt-8 sm:pb-16 md:pt-12">
            {children}
          </main>
        </SeedProvider>
        <SiteNav />
        <footer className="mx-auto w-full max-w-6xl px-5 pb-28 pt-2 sm:pb-10 print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-faint">
              Raktha — Emergency Blood Donor Network
            </p>
            <nav aria-label="Footer" className="flex gap-6">
              <Link href="/settings" className="u-sweep text-[13px] font-semibold uppercase tracking-[0.12em] text-soot">
                Settings
              </Link>
              <Link href="/learn" className="u-sweep text-[13px] font-semibold uppercase tracking-[0.12em] text-soot">
                Learn
              </Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
