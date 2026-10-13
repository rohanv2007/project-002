import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteNav from "@/components/SiteNav";
import SeedProvider from "@/components/SeedProvider";

export const metadata: Metadata = {
  title: "Project 002 · Raktha — Emergency Blood Donor Network",
  description:
    "Raktha (Project 002) connects emergency blood requests with compatible local donors — eligibility screening, donor registry, and request matching.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-crimson-700 focus:ring-2 focus:ring-crimson-600"
        >
          Skip to content
        </a>
        <SiteHeader />
        <SeedProvider>
          <main id="main-content" className="mx-auto w-full max-w-5xl px-4 pb-28 pt-6 sm:px-6 sm:pb-16 sm:pt-8">
            {children}
          </main>
        </SeedProvider>
        <SiteNav />
        <footer className="mx-auto w-full max-w-5xl px-4 pb-28 pt-2 sm:px-6 sm:pb-10 md:pb-10 print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ink-200 pt-4">
            <p className="text-xs text-ink-500">
              Project 002 · Raktha — Emergency Blood Donor Network
            </p>
            <nav aria-label="Footer" className="flex gap-4">
              <Link href="/settings" className="text-xs font-semibold text-ink-600 hover:text-crimson-700">
                Settings
              </Link>
              <Link href="/learn" className="text-xs font-semibold text-ink-600 hover:text-crimson-700">
                Learn
              </Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
