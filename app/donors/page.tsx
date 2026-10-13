"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useDonors, useDeferrals, uid } from "@/lib/store";
import { BLOOD_GROUPS, activeDeferralFor, awayBackLabel, formatDate, isEffectivelyAvailable, isEligibleByInterval, isRare, nextEligibleDate } from "@/lib/blood";
import { badgeFor } from "@/lib/badges";
import { EmptyState, GroupBadge, PageHeader } from "@/components/ui";
import { buildDonorContactText, whatsappHref } from "@/lib/share";
import type { BloodGroup, Donor } from "@/lib/types";

function DonorDirectory() {
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get("registered") === "1";
  const [donors, , , updateDonor, removeDonor] = useDonors();
  const [deferrals, , addDeferral, , removeDeferral] = useDeferrals();
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<BloodGroup | "all">("all");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [pausingId, setPausingId] = useState<string | null>(null);
  const [awayDate, setAwayDate] = useState("");
  const [deferringId, setDeferringId] = useState<string | null>(null);
  const [deferReason, setDeferReason] = useState("");
  const [deferUntil, setDeferUntil] = useState("");

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return donors
      .filter((d) => (group === "all" || d.group === group))
      .filter((d) => !onlyAvailable || (isEffectivelyAvailable(d) && isEligibleByInterval(d.lastDonation) && !activeDeferralFor(deferrals, d.id)))
      .filter((d) => !q || d.name.toLowerCase().includes(q) || d.area.toLowerCase().includes(q))
      .sort((a, b) => {
        const rank = (d: Donor) =>
          activeDeferralFor(deferrals, d.id) ? 0
          : isEffectivelyAvailable(d) && isEligibleByInterval(d.lastDonation) ? 2
          : 1;
        return rank(b) - rank(a) || b.donations - a.donations;
      });
  }, [donors, deferrals, query, group, onlyAvailable]);

  const pauseWithDate = (id: string) => {
    updateDonor(id, { available: false, awayUntil: awayDate || null });
    setPausingId(null);
    setAwayDate("");
  };
  const resume = (id: string) => updateDonor(id, { available: true, awayUntil: null });

  const logDeferral = (id: string) => {
    if (!deferReason.trim() || !deferUntil) return;
    addDeferral({
      id: uid("dfr"),
      donorId: id,
      reason: deferReason.trim(),
      deferredUntil: deferUntil,
      createdAt: new Date().toISOString(),
    });
    setDeferringId(null);
    setDeferReason("");
    setDeferUntil("");
  };

  const donorStatus = (d: Donor): string => {
    const deferral = activeDeferralFor(deferrals, d.id);
    if (deferral) return `Deferred — back ${formatDate(deferral.deferredUntil)}`;
    if (isEffectivelyAvailable(d) && isEligibleByInterval(d.lastDonation)) return "Ready";
    const back = awayBackLabel(d.awayUntil);
    if (back) return `Away — ${back}`;
    if (!d.available) return "Paused";
    const next = nextEligibleDate(d.lastDonation);
    return next ? `Eligible again ${formatDate(next.toISOString().slice(0, 10))}` : "Not eligible";
  };

  // Export the currently filtered directory — camp organisers get a clean call list.
  const downloadCsv = () => {
    const rows: string[][] = [["Name", "Blood group", "Rare phenotype", "Phone", "Area", "Status", "Next eligible", "Lifetime donations"]];
    list.forEach((d) => {
      const next = nextEligibleDate(d.lastDonation);
      rows.push([
        d.name,
        d.group,
        d.rarePhenotype ?? "—",
        d.phone,
        d.area,
        donorStatus(d),
        next ? formatDate(next.toISOString().slice(0, 10)) : "—",
        String(d.donations),
      ]);
    });
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "raktha-donor-directory.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader
        title="Donor directory"
        subtitle="Everyone registered in the network. Green means ready to be called tonight."
      />

      {justRegistered && (
        <p role="status" className="mb-4 rounded-[3px] bg-cream px-4 py-3 text-sm font-medium text-moss ring-1 ring-inset ring-line">
          You're registered — thank you. You'll now appear in emergency matches for your blood group.
        </p>
      )}

      {(() => {
        const rare = donors.filter((d) => isRare(d.group) || d.rarePhenotype);
        const readyRare = rare.filter(
          (d) => isEffectivelyAvailable(d) && isEligibleByInterval(d.lastDonation) && !activeDeferralFor(deferrals, d.id)
        );
        if (rare.length === 0) return null;
        return (
          <section aria-label="Rare donor registry" className="mb-6 rounded-[4px] border border-line bg-cream/50 p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-[24px] font-semibold tracking-tight text-ink">Rare donor registry</h2>
              <p className="tnum text-xs font-semibold text-signal">
                {readyRare.length} of {rare.length} ready now
              </p>
            </div>
            <p className="mt-1 text-sm text-soot">
              Rh-negative groups and rare phenotypes — the hardest to find in an emergency.
              Mirrors the national rare donor registry ICMR-NIIH is building into e-RaktKosh.
            </p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {rare.map((d) => {
                const deferral = activeDeferralFor(deferrals, d.id);
                const ready = isEffectivelyAvailable(d) && isEligibleByInterval(d.lastDonation) && !deferral;
                return (
                  <li key={d.id} className="flex items-center gap-3 rounded-[3px] bg-cream px-4 py-3 ring-1 ring-inset ring-line">
                    <GroupBadge group={d.group} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">
                        {d.name}
                        <span className={`ml-2 text-xs font-bold ${ready ? "text-moss" : "text-faint"}`}>
                          {ready ? "● ready" : "○ not ready"}
                        </span>
                      </p>
                      <p className="truncate text-xs text-faint">
                        {d.rarePhenotype ? `${d.rarePhenotype} · ` : ""}{d.area}
                        {deferral ? ` · deferred till ${formatDate(deferral.deferredUntil)}` : ""}
                      </p>
                    </div>
                    {ready && (
                      <div className="flex shrink-0 gap-1.5">
                        <a
                          href={`tel:${d.phone.replace(/[\s-]/g, "")}`}
                          className="inline-flex min-h-[44px] items-center rounded-[3px] bg-signal px-4 py-2 text-xs font-semibold text-cream hover:bg-ember"
                        >
                          Call
                        </a>
                        <a
                          href={whatsappHref(buildDonorContactText(d.name, d.group))}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Message ${d.name} on WhatsApp`}
                          className="inline-flex min-h-[44px] items-center rounded-[3px] border border-moss bg-cream px-3 py-2 text-xs font-semibold text-moss hover:bg-cream"
                        >
                          WhatsApp
                        </a>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })()}

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name or area…"
          aria-label="Search donors by name or area"
          className="w-full rounded-[3px] border border-line bg-cream px-3.5 py-2.5 text-sm min-h-[44px] sm:max-w-xs"
        />
        <select
          aria-label="Filter by blood group"
          value={group}
          onChange={(e) => setGroup(e.target.value as BloodGroup | "all")}
          className="rounded-[3px] border border-line bg-cream px-3 py-2.5 text-sm font-medium min-h-[44px]"
        >
          <option value="all">All groups</option>
          {BLOOD_GROUPS.map((g) => (
            <option key={g} value={g}>{g}{isRare(g) ? " — rare" : ""}</option>
          ))}
        </select>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-soot">
          <input
            type="checkbox"
            checked={onlyAvailable}
            onChange={(e) => setOnlyAvailable(e.target.checked)}
            className="h-5 w-5 rounded accent-[#c93e1c]"
          />
          Ready donors only
        </label>
        <div className="flex flex-col gap-2 sm:ml-auto sm:flex-row">
          {list.length > 0 && (
            <button
              onClick={downloadCsv}
              className="min-h-[44px] rounded-[3px] border border-line bg-cream px-5 py-2.5 text-sm font-semibold text-ink hover:bg-paper"
            >
              Download CSV
            </button>
          )}
          <Link href="/donors/register" className="rounded-[3px] bg-signal px-5 py-2.5 text-center text-sm font-semibold text-cream hover:bg-ember min-h-[44px] inline-flex items-center justify-center">
            + Register donor
          </Link>
          <Link href="/watches" className="rounded-[3px] border border-line px-5 py-2.5 text-center text-sm font-semibold text-ink hover:bg-paper min-h-[44px] inline-flex items-center justify-center">
            Watch a group
          </Link>
        </div>
      </div>

      <p aria-live="polite" role="status" className="sr-only">
        {list.length} {list.length === 1 ? "donor" : "donors"} shown
      </p>

      {list.length === 0 ? (
        <EmptyState
          kind="search"
          title="No donors match"
          body="Try clearing the search or filters — or be the first donor in this view by registering."
          action={<Link href="/donors/register" className="rounded-[3px] bg-signal px-5 py-2.5 text-sm font-semibold text-cream">Register as a donor</Link>}
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {list.map((d) => {
            const eligible = isEligibleByInterval(d.lastDonation);
            const next = nextEligibleDate(d.lastDonation);
            const active = isEffectivelyAvailable(d);
            const deferral = activeDeferralFor(deferrals, d.id);
            const ready = active && eligible && !deferral;
            const back = awayBackLabel(d.awayUntil);
            const badge = badgeFor(d.donations);
            return (
              <li key={d.id} className="rounded-[4px] border border-line bg-cream p-4">
                <div className="flex items-start gap-3">
                  <GroupBadge group={d.group} />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-ink">
                      <span className="truncate">{d.name}</span>
                      {badge && (
                        <span
                          className="inline-flex shrink-0 items-center gap-0.5 rounded-[3px] bg-cream px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gold ring-1 ring-inset ring-line"
                          title={`${d.donations} donations — ${badge.label} badge`}
                        >
                          <span aria-hidden="true">★</span> {badge.label}
                        </span>
                      )}
                      {d.rarePhenotype && (
                        <span
                          className="inline-flex shrink-0 items-center rounded-[3px] bg-cream px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-signal ring-1 ring-inset ring-line"
                          title={`Rare phenotype: ${d.rarePhenotype}`}
                        >
                          Rare: {d.rarePhenotype}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-faint">{d.area} · <span className="tnum">{d.phone}</span></p>
                    {deferral ? (
                      <p className="mt-1 inline-flex items-center rounded-[3px] bg-cream px-2 py-0.5 text-xs font-bold text-gold ring-1 ring-inset ring-line">
                        Deferred until {formatDate(deferral.deferredUntil)} · {deferral.reason}
                      </p>
                    ) : (
                      <p className={`mt-1 text-xs font-medium ${ready ? "text-moss" : "text-faint"}`}>
                        {ready
                          ? `Ready — ${d.donations} donation${d.donations === 1 ? "" : "s"} so far`
                          : back
                            ? `Away · ${back}`
                            : !d.available
                              ? "Paused by donor"
                              : next
                                ? `Eligible again ${formatDate(next.toISOString().slice(0, 10))}`
                                : "Not currently eligible"}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
                  {pausingId === d.id ? (
                    <div className="flex w-full flex-wrap items-center gap-2">
                      <input
                        type="date"
                        value={awayDate}
                        onChange={(e) => setAwayDate(e.target.value)}
                        min={new Date().toISOString().slice(0, 10)}
                        aria-label={`Return date for ${d.name} (optional)`}
                        className="rounded-[3px] border border-line px-2.5 py-1.5 text-xs min-h-[44px]"
                      />
                      <button
                        onClick={() => pauseWithDate(d.id)}
                        className="rounded-[3px] bg-ink px-3 py-1.5 text-xs font-semibold text-cream min-h-[44px]"
                      >
                        {awayDate ? "Pause till date" : "Pause indefinitely"}
                      </button>
                      <button
                        onClick={() => { setPausingId(null); setAwayDate(""); }}
                        className="rounded-[3px] px-3 py-1.5 text-xs font-semibold text-faint hover:bg-paper min-h-[44px]"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : deferringId === d.id ? (
                    <div className="flex w-full flex-wrap items-center gap-2">
                      <input
                        type="text"
                        value={deferReason}
                        onChange={(e) => setDeferReason(e.target.value)}
                        placeholder="Reason (e.g. low haemoglobin)"
                        aria-label={`Deferral reason for ${d.name}`}
                        className="min-w-0 flex-1 rounded-[3px] border border-line px-2.5 py-1.5 text-xs min-h-[44px]"
                      />
                      <input
                        type="date"
                        value={deferUntil}
                        onChange={(e) => setDeferUntil(e.target.value)}
                        min={new Date().toISOString().slice(0, 10)}
                        aria-label={`Deferral end date for ${d.name}`}
                        className="rounded-[3px] border border-line px-2.5 py-1.5 text-xs min-h-[44px]"
                      />
                      <button
                        onClick={() => logDeferral(d.id)}
                        disabled={!deferReason.trim() || !deferUntil}
                        className="rounded-[3px] bg-gold px-3 py-1.5 text-xs font-semibold text-cream hover:bg-gold disabled:cursor-not-allowed disabled:bg-line min-h-[44px]"
                      >
                        Log deferral
                      </button>
                      <button
                        onClick={() => { setDeferringId(null); setDeferReason(""); setDeferUntil(""); }}
                        className="rounded-[3px] px-3 py-1.5 text-xs font-semibold text-faint hover:bg-paper min-h-[44px]"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => (active ? setPausingId(d.id) : resume(d.id))}
                        aria-pressed={d.available}
                        className={`rounded-[3px] px-3 py-1.5 text-xs font-semibold min-h-[44px] ${
                          active ? "bg-sand text-soot hover:bg-sand" : "bg-cream text-moss hover:bg-sand"
                        }`}
                      >
                        {active ? "Pause" : "Resume"}
                      </button>
                      {deferral ? (
                        <button
                          onClick={() => removeDeferral(deferral.id)}
                          className="rounded-[3px] bg-cream px-3 py-1.5 text-xs font-semibold text-gold hover:bg-sand min-h-[44px]"
                        >
                          Clear deferral
                        </button>
                      ) : (
                        <button
                          onClick={() => setDeferringId(d.id)}
                          className="rounded-[3px] bg-sand px-3 py-1.5 text-xs font-semibold text-soot hover:bg-sand min-h-[44px]"
                        >
                          Defer
                        </button>
                      )}
                      <a href={`tel:${d.phone.replace(/[\s-]/g, "")}`} className="rounded-[3px] bg-sand px-3 py-1.5 text-xs font-semibold text-soot hover:bg-sand min-h-[44px] inline-flex items-center">
                        Call
                      </a>
                      <button
                        onClick={() => { if (window.confirm(`Remove ${d.name} from the directory?`)) removeDonor(d.id); }}
                        className="ml-auto rounded-[3px] px-3 py-1.5 text-xs font-semibold text-faint hover:bg-cream hover:text-signal min-h-[44px]"
                      >
                        Remove
                      </button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function DonorsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-faint">Loading donors…</p>}>
      <DonorDirectory />
    </Suspense>
  );
}
