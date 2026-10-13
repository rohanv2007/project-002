"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/request", label: "Request blood" },
  { href: "/donors", label: "Donors" },
  { href: "/requests", label: "Requests" },
  { href: "/banks", label: "Blood banks" },
  { href: "/camps", label: "Camps" },
  { href: "/patients", label: "Patients" },
  { href: "/teams", label: "Teams" },
  { href: "/learn", label: "Learn" },
  { href: "/me", label: "My donations" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-ink-200 bg-white/95 backdrop-blur print:hidden">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3" aria-label="Project 002 Raktha home">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-crimson-600 text-lg font-bold text-white"
            aria-hidden="true"
          >
            R
          </span>
          <span className="leading-tight">
            <span className="block text-base font-semibold tracking-tight text-ink-900">
              Raktha
            </span>
            <span className="block text-[11px] font-medium uppercase tracking-widest text-ink-500">
              Project 002 · Blood network
            </span>
          </span>
        </Link>
        <nav className="ml-auto hidden items-center gap-1 md:flex" aria-label="Primary">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-crimson-50 text-crimson-700"
                    : "text-ink-600 hover:bg-ink-100 hover:text-ink-900"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <Link
          href="/request"
          className="ml-auto rounded-lg bg-crimson-600 px-4 py-2 text-sm font-semibold text-white hover:bg-crimson-700 md:ml-2"
        >
          Emergency
        </Link>
      </div>
    </header>
  );
}
