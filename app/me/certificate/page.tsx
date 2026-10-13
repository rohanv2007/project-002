"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useDonations, readMyName } from "@/lib/store";
import { MILESTONE_TIERS, badgeFor } from "@/lib/badges";
import { formatDate } from "@/lib/blood";

function Certificate() {
  const searchParams = useSearchParams();
  const [donations] = useDonations();
  const [name, setName] = useState("");

  useEffect(() => {
    setName(readMyName());
  }, []);

  const tier = useMemo(() => {
    const n = Number(searchParams.get("n"));
    const exact = MILESTONE_TIERS.find((t) => t.n === n);
    if (exact && donations.length >= exact.n) return exact;
    return badgeFor(donations.length);
  }, [searchParams, donations.length]);

  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const totalUnits = donations.reduce((s, d) => s + d.units, 0);

  if (!tier) {
    return (
      <div className="mx-auto max-w-2xl py-10 text-center">
        <p className="text-sm text-ink-600">No milestone earned yet — log your first donation to earn a certificate.</p>
        <Link href="/me" className="mt-4 inline-block text-sm font-semibold text-crimson-700 hover:underline">Back to My donations</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Screen-only controls */}
      <div className="print:hidden">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link href="/me" className="text-sm font-semibold text-crimson-700 hover:underline">← Back to My donations</Link>
          <button
            onClick={() => window.print()}
            className="rounded-xl bg-crimson-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-crimson-700 min-h-[44px]"
          >
            Print certificate
          </button>
        </div>
        <p className="mb-4 text-sm text-ink-600">
          Certificate preview — printing produces just the certificate, on one page.
        </p>
      </div>

      {/* The certificate itself: shows on screen AND in print */}
      <div className="rounded-none border-4 border-double border-ink-800 bg-white p-8 sm:p-12 print:border-4">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-ink-500">Raktha · Project 002</p>
          <h1 className="mt-3 text-3xl font-bold text-ink-900 sm:text-4xl">Certificate of Gratitude</h1>
          <p className="mt-2 text-sm text-ink-600">Presented with deep thanks to</p>
          <p className="mt-3 border-b-2 border-ink-200 pb-3 text-2xl font-bold text-crimson-700 sm:text-3xl">
            {name || "A life-saving donor"}
          </p>
          <p className="mt-4 text-sm text-ink-700">
            for completing <strong className="text-ink-900">{tier.n} blood donation{tier.n === 1 ? "" : "s"}</strong> and earning the
          </p>
          <p className="mt-2 inline-block rounded-xl bg-amber-50 px-6 py-2 text-xl font-bold text-amber-800 ring-1 ring-inset ring-amber-200">
            ★ {tier.label}
          </p>
          <p className="mt-3 text-sm italic text-ink-600">"{tier.desc}"</p>
          <div className="mx-auto mt-6 grid max-w-md grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-ink-50 px-2 py-3">
              <p className="tnum text-xl font-bold text-ink-900">{donations.length}</p>
              <p className="text-[11px] text-ink-500">donations</p>
            </div>
            <div className="rounded-xl bg-ink-50 px-2 py-3">
              <p className="tnum text-xl font-bold text-ink-900">{totalUnits}</p>
              <p className="text-[11px] text-ink-500">units given</p>
            </div>
            <div className="rounded-xl bg-ink-50 px-2 py-3">
              <p className="tnum text-xl font-bold text-ink-900">{totalUnits * 3}</p>
              <p className="text-[11px] text-ink-500">lives touched</p>
            </div>
          </div>
          <p className="mt-6 text-xs text-ink-500">
            Issued {today} · {donations.length > 0 && donations[0] ? `first donation ${formatDate([...donations].sort((a, b) => a.date.localeCompare(b.date))[0].date)}` : ""}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CertificatePage() {
  return (
    <Suspense fallback={<p className="text-sm text-ink-500">Loading…</p>}>
      <Certificate />
    </Suspense>
  );
}
