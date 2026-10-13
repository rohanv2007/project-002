"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/donors", label: "Donors" },
  { href: "/request", label: "Request" },
  { href: "/requests", label: "Board" },
  { href: "/camps", label: "Camps" },
  { href: "/teams", label: "Teams" },
  { href: "/learn", label: "Learn" },
  { href: "/me", label: "Mine" },
];

export default function SiteNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Mobile"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden print:hidden"
    >
      <div className="grid grid-cols-8">
        {LINKS.map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${
                active ? "text-crimson-700" : "text-ink-500"
              }`}
            >
              <span
                className={`h-1.5 w-8 rounded-full ${active ? "bg-crimson-600" : "bg-transparent"}`}
                aria-hidden="true"
              />
              {l.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
