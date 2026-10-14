"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useDonors, useRequests, useBanks, useWatches, usePatients } from "@/lib/store";
import { BLOOD_GROUPS, COMPATIBLE_DONORS, freshWatchMatches, isEffectivelyAvailable, isEligibleByInterval, isRare } from "@/lib/blood";
import { computeGroupNeeds, needReason, topAlerts } from "@/lib/need";
import { forecastFrom, levelBadge } from "@/lib/forecast";
import { GroupBadge, Kicker, PageHeader, StatCard, UrgencyBadge } from "@/components/ui";
import { timeAgo } from "@/lib/blood";

/** First-visit orientation: three steps, dismissible, never shown again. */
function HowItWorks() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    try {
      if (!window.localStorage.getItem("raktha.howto.v1")) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);
  if (!visible) return null;
  const dismiss = () => {
    try {
      window.localStorage.setItem("raktha.howto.v1", "1");
    } catch {
      /* storage unavailable — dismiss for this visit only */
    }
    setVisible(false);
  };
  const steps = [
    { n: "1", title: "Register", body: "Add yourself as a donor with your blood group and area — one minute." },
    { n: "2", title: "Check eligibility", body: "Run the 90-second self-screen so you never make a wasted trip." },
    { n: "3", title: "Answer the call", body: "When a nearby patient needs your group, call or WhatsApp them directly." },
  ];
  return (
    <section aria-label="How Raktha works" className="rounded-[4px] border border-line bg-cream p-5 sm:p-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Kicker>How it works</Kicker>
          <h2 className="mt-3 font-display text-[28px] font-semibold tracking-tight md:text-[36px]">
            Three steps between <em className="text-signal">“someone needs blood”</em> and <em>donated</em>.
          </h2>
        </div>
        <button
          onClick={dismiss}
          className="shrink-0 rounded-[3px] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-faint hover:text-ink min-h-[44px]"
          aria-label="Dismiss introduction"
        >
          Dismiss
        </button>
      </div>
      <div className="mt-8 border-t border-line">
        {steps.map((s) => (
          <div
            key={s.n}
            className="step-row grid gap-2 border-b border-line px-2 py-6 md:grid-cols-[80px_200px_1fr] md:gap-8 md:px-4"
          >
            <p className="font-display text-[15px] italic text-faint">{s.n.padStart(2, "0")}</p>
            <p className="font-display text-[20px] font-semibold tracking-tight text-ink">{s.title}</p>
            <p className="text-[15px] leading-relaxed text-soot">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const [donors] = useDonors();
  const [requests] = useRequests();
  const [banks] = useBanks();
  const [watches] = useWatches();
  const watchHits = freshWatchMatches(watches, donors);
  const [patients] = usePatients();
  const dueSoon = patients.filter((p) => {
    if (!p.nextDue) return false;
    const diff = new Date(p.nextDue + "T00:00:00").getTime() - new Date(new Date().toISOString().slice(0, 10) + "T00:00:00").getTime();
    return diff <= 7 * 86400_000;
  });

  const available = donors.filter((d) => isEffectivelyAvailable(d) && isEligibleByInterval(d.lastDonation));
  const open = requests.filter((r) => r.status === "open" && new Date(r.expiresAt) > new Date());
  const critical = open.filter((r) => r.urgency === "critical");
  const rareCovered = BLOOD_GROUPS.filter(
    (g) => isRare(g) && available.some((d) => COMPATIBLE_DONORS[g].includes(d.group))
  ).length;
  const totalUnits = banks.reduce(
    (sum, b) => sum + Object.values(b.stock).reduce((a, n) => a + n, 0),
    0
  );

  const groupCounts = BLOOD_GROUPS.map((g) => ({
    group: g,
    count: available.filter((d) => COMPATIBLE_DONORS[g].includes(d.group)).length,
  }));

  const alerts = topAlerts(computeGroupNeeds(donors, requests, banks));

  const forecast = forecastFrom(new Date().getMonth() + 1);

  const fulfilled = requests
    .filter((r) => r.status === "fulfilled")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 3);

  return (
    <div className="space-y-12">
      {/* ---------- Editorial hero ---------- */}
      <section className="pt-6 md:pt-10">
        <Kicker>The emergency blood network</Kicker>
        <h1 className="mt-6 max-w-4xl font-display text-[44px] font-semibold leading-[1.04] tracking-tight md:text-[76px]">
          When blood is needed, <em className="text-signal">minutes</em> matter.
        </h1>
        <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-soot md:text-[18px]">
          Live picture of who&apos;s ready to donate, who needs blood right
          now, and where the gaps are. No accounts, no waiting — just donors
          and patients, connected.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/request"
            className="lift rounded-[3px] bg-signal px-6 py-3.5 text-[13px] font-semibold uppercase tracking-[0.12em] text-cream"
          >
            Post an emergency request
          </Link>
          <Link
            href="/donors/register"
            className="lift rounded-[3px] border border-ink px-6 py-3.5 text-[13px] font-semibold uppercase tracking-[0.12em] text-ink"
          >
            Register as a donor
          </Link>
        </div>

        {/* Stats band */}
        <div className="mt-14 grid grid-cols-2 gap-8 border-t border-line pt-8 md:grid-cols-4">
          <StatCard label="Ready donors" value={available.length} hint={`of ${donors.length} registered`} />
          <StatCard label="Open requests" value={open.length} hint={critical.length ? `${critical.length} critical` : "none critical"} />
          <StatCard label="Rare groups covered" value={`${rareCovered}/4`} hint="O− A− B− AB− with a match" />
          <StatCard label="Bank units" value={totalUnits} hint={`${banks.length} blood banks`} />
        </div>
      </section>

      <HowItWorks />

      {watchHits.length > 0 && (
        <section aria-label="Watchlist hits" className="rounded-[4px] border-2 border-signal bg-cream p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-[24px] font-semibold tracking-tight text-ink">Watchlist: new donors found</h2>
            <Link href="/watches" className="text-sm font-semibold text-signal hover:underline">
              Manage watches
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {watchHits.slice(0, 3).map(({ watch, donor }) => (
              <li key={`${watch.id}:${donor.id}`} className="flex items-center gap-3 rounded-[3px] bg-cream px-4 py-3">
                <GroupBadge group={donor.group} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{donor.name}</p>
                  <p className="text-xs text-faint">{donor.area} · matches your {watch.group} watch</p>
                </div>
                <span className="flex shrink-0 items-center gap-2">
                  <a
                    href={`tel:${donor.phone.replace(/[\s-]/g, "")}`}
                    className="rounded-[3px] bg-signal px-4 py-2 text-sm font-semibold text-cream hover:bg-ember min-h-[44px] inline-flex items-center"
                  >
                    Call
                  </a>
                  <Link href="/donors" className="rounded-[3px] border border-line px-4 py-2 text-sm font-semibold text-soot hover:bg-paper min-h-[44px] inline-flex items-center">
                    View
                  </Link>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {dueSoon.length > 0 && (
        <section aria-label="Transfusions due soon" className="rounded-[4px] border border-line bg-cream p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-[24px] font-semibold tracking-tight text-ink">Transfusions due within a week</h2>
            <Link href="/patients" className="text-sm font-semibold text-signal hover:underline">
              All patients
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {dueSoon.map((p) => (
              <li key={p.id} className="flex items-center gap-3 rounded-[3px] bg-cream px-4 py-3 ring-1 ring-inset ring-line">
                <GroupBadge group={p.group} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{p.name}</p>
                  <p className="text-xs text-faint">
                    {p.condition} · {p.nextDue && new Date(p.nextDue + "T00:00:00").getTime() < new Date(new Date().toISOString().slice(0, 10) + "T00:00:00").getTime()
                      ? "overdue — request now"
                      : `due ${p.nextDue}`}
                  </p>
                </div>
                <Link href={`/request?patient=${p.id}`} className="shrink-0 rounded-[3px] bg-signal px-4 py-2 text-xs font-semibold text-cream hover:bg-ember min-h-[44px] inline-flex items-center">
                  Request
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {critical.length > 0 && (
        <section aria-label="Critical requests" className="rounded-[4px] border-2 border-signal bg-cream p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-[24px] font-semibold tracking-tight text-ink">Critical right now</h2>
            <Link href="/requests" className="text-sm font-semibold text-signal hover:underline">
              View all
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {critical.slice(0, 3).map((r) => (
              <li key={r.id} className="flex items-center gap-3 rounded-[3px] bg-cream px-4 py-3">
                <GroupBadge group={r.group} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">
                    {r.units} unit{r.units > 1 ? "s" : ""} · {r.hospital}
                  </p>
                  <p className="text-xs text-faint">{timeAgo(r.createdAt)} · {r.area}</p>
                </div>
                <a
                  href={`tel:${r.contactPhone.replace(/\s/g, "")}`}
                  className="rounded-[3px] bg-signal px-4 py-2 text-sm font-semibold text-cream hover:bg-ember"
                >
                  Call
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-label="Shortage alerts" className="rounded-[4px] border border-line bg-cream p-5 sm:p-6">
        <h2 className="font-display text-[24px] font-semibold tracking-tight text-ink">Needed in your area right now</h2>
        <p className="mt-1 text-sm text-soot">
          Live shortage signal — groups where open demand outruns ready donors and bank stock.
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {alerts.map(({ need, level }) => (
            <li key={need.group} className="rounded-[3px] border border-line bg-cream px-4 py-3">
              <div className="flex items-center gap-2">
                <GroupBadge group={need.group} />
                <span
                  className={`rounded-[3px] px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${
                    level === "shortage" ? "bg-signal text-cream" : "bg-cream text-gold"
                  }`}
                >
                  {level === "shortage" ? "Shortage" : "Watch"}
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold text-ink">
                {need.demandUnits} unit{need.demandUnits === 1 ? "" : "s"} needed
                <span className="font-normal text-faint"> · {need.readyDonors} ready donor{need.readyDonors === 1 ? "" : "s"}</span>
              </p>
              <p className="mt-0.5 text-xs text-faint">{needReason(need)}</p>
              <Link href="/donors/register" className="mt-2 inline-block text-sm font-semibold text-signal hover:underline">
                Register as a donor →
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Demand forecast" className="rounded-[4px] border border-line bg-cream p-5 sm:p-6">
        <h2 className="font-display text-[24px] font-semibold tracking-tight text-ink">Demand forecast</h2>
        <p className="mt-1 text-sm text-soot">
          Blood demand follows the seasons. A unit donated 2–3 weeks before a peak helps far more than one donated after it.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {forecast.map((m) => {
            const badge = levelBadge(m.level);
            return (
              <div key={m.month} className="rounded-[3px] bg-paper p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-ink">{m.name}</p>
                  <span className={`rounded-[3px] px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${badge.cls}`}>
                    {badge.label}
                  </span>
                </div>
                <p className="mt-2 text-xs text-soot">{m.drivers.join(" · ")}</p>
                <p className="mt-2 text-xs font-medium text-ink">{m.tip}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section aria-label="Compatibility coverage" className="rounded-[4px] border border-line bg-cream p-5 sm:p-6">
        <h2 className="font-display text-[24px] font-semibold tracking-tight text-ink">Who can cover each group tonight</h2>
        <p className="mt-1 text-sm text-soot">
          Ready, eligible donors whose blood can go to a patient of each group.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {groupCounts.map(({ group, count }) => (
            <div key={group} className="rounded-[3px] bg-paper px-4 py-3">
              <GroupBadge group={group} size="sm" />
              <p className="tnum mt-2 text-2xl font-bold text-ink">{count}</p>
              <p className="text-xs text-faint">compatible donor{count === 1 ? "" : "s"}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link href="/request" className="lift rounded-[4px] bg-signal p-6 text-cream md:p-8">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-cream/80">
            <span className="inline-block h-[7px] w-[7px] bg-cream" aria-hidden="true" />
            For patients
          </p>
          <h2 className="mt-3 font-display text-[26px] font-semibold tracking-tight">Someone needs blood</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-cream/90">
            Post a request in under a minute. We&apos;ll show you every compatible donor to call.
          </p>
          <span className="mt-5 inline-block rounded-[3px] bg-cream px-5 py-2.5 text-[13px] font-semibold uppercase tracking-[0.12em] text-signal">
            Post an emergency request
          </span>
        </Link>
        <Link href="/donors/register" className="lift rounded-[4px] border border-ink bg-cream p-6 md:p-8">
          <Kicker>For donors</Kicker>
          <h2 className="mt-3 font-display text-[26px] font-semibold tracking-tight text-ink">You can save a life</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-soot">
            Register as a donor, check your eligibility in 2 minutes, and get counted tonight.
          </p>
          <span className="mt-5 inline-block rounded-[3px] border border-ink px-5 py-2.5 text-[13px] font-semibold uppercase tracking-[0.12em] text-ink">
            Register as a donor
          </span>
        </Link>
      </section>

      {fulfilled.length > 0 && (
        <section aria-label="Recently fulfilled">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-[24px] font-semibold tracking-tight text-ink">Recently fulfilled</h2>
            <Link href="/requests" className="text-sm font-semibold text-signal hover:underline">
              All requests
            </Link>
          </div>
          <ul className="space-y-3">
            {fulfilled.map((r) => (
              <li key={r.id} className="flex items-center gap-3 rounded-[4px] border border-line bg-cream px-4 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-moss text-sm font-bold text-cream" aria-hidden="true">
                  ✓
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">
                    {r.units} unit{r.units > 1 ? "s" : ""} of {r.group} → {r.patientName}
                  </p>
                  <p className="text-xs text-faint">{r.hospital} · {timeAgo(r.createdAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {open.length > 0 && (
        <section aria-label="Recent requests">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-[24px] font-semibold tracking-tight text-ink">Latest requests</h2>
            <Link href="/requests" className="text-sm font-semibold text-signal hover:underline">
              All requests
            </Link>
          </div>
          <ul className="space-y-3">
            {open.slice(0, 3).map((r) => (
              <li key={r.id} className="flex items-center gap-3 rounded-[4px] border border-line bg-cream px-4 py-3">
                <GroupBadge group={r.group} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">
                    {r.patientName} · {r.hospital}
                  </p>
                  <p className="text-xs text-faint">{timeAgo(r.createdAt)} · {r.area}</p>
                </div>
                <UrgencyBadge urgency={r.urgency} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
