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
        <p className="text-sm text-soot">No milestone earned yet — log your first donation to earn a certificate.</p>
        <Link href="/me" className="mt-4 inline-block text-sm font-semibold text-signal hover:underline">Back to My donations</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Screen-only controls */}
      <div className="print:hidden">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link href="/me" className="text-sm font-semibold text-signal hover:underline">← Back to My donations</Link>
          <button
            onClick={() => window.print()}
            className="rounded-[3px] bg-signal px-5 py-2.5 text-sm font-semibold text-cream hover:bg-ember min-h-[44px]"
          >
            Print certificate
          </button>
        </div>
        <p className="mb-4 text-sm text-soot">
          Certificate preview — printing produces just the certificate, on one page.
        </p>
      </div>

      {/* The certificate itself: shows on screen AND in print */}
      <div className="rounded-none border-4 border-double border-ink bg-cream p-8 sm:p-12 print:border-4">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-faint">Raktha</p>
          <h1 className="mt-3 text-3xl font-bold text-ink sm:text-4xl">Certificate of Gratitude</h1>
          <p className="mt-2 text-sm text-soot">Presented with deep thanks to</p>
          <p className="mt-3 border-b-2 border-line pb-3 text-2xl font-bold text-signal sm:text-3xl">
            {name || "A life-saving donor"}
          </p>
          <p className="mt-4 text-sm text-soot">
            for completing <strong className="text-ink">{tier.n} blood donation{tier.n === 1 ? "" : "s"}</strong> and earning the
          </p>
          <p className="mt-2 inline-block rounded-[3px] bg-cream px-6 py-2 text-xl font-bold text-gold ring-1 ring-inset ring-line">
            ★ {tier.label}
          </p>
          <p className="mt-3 text-sm italic text-soot">"{tier.desc}"</p>
          <div className="mx-auto mt-6 grid max-w-md grid-cols-3 gap-2 text-center">
            <div className="rounded-[3px] bg-paper px-2 py-3">
              <p className="tnum text-xl font-bold text-ink">{donations.length}</p>
              <p className="text-[11px] text-faint">donations</p>
            </div>
            <div className="rounded-[3px] bg-paper px-2 py-3">
              <p className="tnum text-xl font-bold text-ink">{totalUnits}</p>
              <p className="text-[11px] text-faint">units given</p>
            </div>
            <div className="rounded-[3px] bg-paper px-2 py-3">
              <p className="tnum text-xl font-bold text-ink">{totalUnits * 3}</p>
              <p className="text-[11px] text-faint">lives touched</p>
            </div>
          </div>
          <p className="mt-6 text-xs text-faint">
            Issued {today} · {donations.length > 0 && donations[0] ? `first donation ${formatDate([...donations].sort((a, b) => a.date.localeCompare(b.date))[0].date)}` : ""}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CertificatePage() {
  return (
    <Suspense fallback={<p className="text-sm text-faint">Loading…</p>}>
      <Certificate />
    </Suspense>
  );
}
