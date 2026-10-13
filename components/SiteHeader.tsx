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
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur print:hidden">
      <div className="mx-auto flex h-[72px] w-full max-w-6xl items-center gap-3 px-5">
        <Link href="/" className="flex items-center gap-3" aria-label="Project 002 Raktha home">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-[3px] bg-signal font-display text-xl font-bold text-cream"
            aria-hidden="true"
          >
            R
          </span>
          <span className="leading-tight">
            <span className="block font-display text-[22px] font-semibold tracking-tight text-ink">
              Raktha
            </span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-faint">
              Project 002 · Blood network
            </span>
          </span>
        </Link>
        <nav className="ml-auto hidden items-center gap-6 md:flex" aria-label="Primary">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                data-active={active}
                className={`u-sweep text-[13px] font-semibold uppercase tracking-[0.1em] ${
                  active ? "text-signal" : "text-soot hover:text-ink"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <Link
          href="/request"
          className="lift ml-auto rounded-[3px] bg-signal px-5 py-2.5 text-[13px] font-semibold uppercase tracking-[0.12em] text-cream md:ml-6"
        >
          Emergency
        </Link>
      </div>
    </header>
  );
}
