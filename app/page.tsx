"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useDonors, useRequests, useBanks, useWatches, usePatients } from "@/lib/store";
import { BLOOD_GROUPS, COMPATIBLE_DONORS, freshWatchMatches, isEffectivelyAvailable, isEligibleByInterval, isRare } from "@/lib/blood";
import { computeGroupNeeds, needReason, topAlerts } from "@/lib/need";
import { forecastFrom, levelBadge } from "@/lib/forecast";
import { GroupBadge, PageHeader, StatCard, UrgencyBadge } from "@/components/ui";
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
    <section aria-label="How Raktha works" className="rounded-2xl border border-crimson-200 bg-crimson-50/60 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-base font-bold text-ink-900">How Raktha works</h2>
        <button
          onClick={dismiss}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-ink-500 hover:bg-white hover:text-ink-800 min-h-[44px]"
          aria-label="Dismiss introduction"
        >
          Dismiss
        </button>
      </div>
      <ol className="mt-3 grid gap-3 sm:grid-cols-3">
        {steps.map((s) => (
          <li key={s.n} className="rounded-xl bg-white p-4 ring-1 ring-inset ring-ink-100">
            <p className="flex h-7 w-7 items-center justify-center rounded-full bg-crimson-600 text-sm font-bold text-white" aria-hidden="true">
              {s.n}
            </p>
            <p className="mt-2 text-sm font-bold text-ink-900">{s.title}</p>
            <p className="mt-0.5 text-sm text-ink-600">{s.body}</p>
          </li>
        ))}
      </ol>
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
    <div className="space-y-8">
      <PageHeader
        title="Tonight's blood network"
        subtitle="Live picture of who's ready to donate, who needs blood right now, and where the gaps are."
      />

      <HowItWorks />

      <section aria-label="Network statistics" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Ready donors" value={available.length} hint={`of ${donors.length} registered`} />
        <StatCard label="Open requests" value={open.length} hint={critical.length ? `${critical.length} critical` : "none critical"} />
        <StatCard label="Rare groups covered" value={`${rareCovered}/4`} hint="O− A− B− AB− with a match" />
        <StatCard label="Bank units" value={totalUnits} hint={`${banks.length} blood banks`} />
      </section>

      {watchHits.length > 0 && (
        <section aria-label="Watchlist hits" className="rounded-2xl border-2 border-crimson-600 bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-ink-900">Watchlist: new donors found</h2>
            <Link href="/watches" className="text-sm font-semibold text-crimson-700 hover:underline">
              Manage watches
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {watchHits.slice(0, 3).map(({ watch, donor }) => (
              <li key={`${watch.id}:${donor.id}`} className="flex items-center gap-3 rounded-xl bg-crimson-50 px-4 py-3">
                <GroupBadge group={donor.group} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-900">{donor.name}</p>
                  <p className="text-xs text-ink-500">{donor.area} · matches your {watch.group} watch</p>
                </div>
                <span className="flex shrink-0 items-center gap-2">
                  <a
                    href={`tel:${donor.phone.replace(/[\s-]/g, "")}`}
                    className="rounded-lg bg-crimson-600 px-4 py-2 text-sm font-semibold text-white hover:bg-crimson-700 min-h-[44px] inline-flex items-center"
                  >
                    Call
                  </a>
                  <Link href="/donors" className="rounded-lg border border-ink-300 px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-ink-50 min-h-[44px] inline-flex items-center">
                    View
                  </Link>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {dueSoon.length > 0 && (
        <section aria-label="Transfusions due soon" className="rounded-2xl border border-amber-300 bg-amber-50 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-ink-900">Transfusions due within a week</h2>
            <Link href="/patients" className="text-sm font-semibold text-crimson-700 hover:underline">
              All patients
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {dueSoon.map((p) => (
              <li key={p.id} className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-inset ring-amber-200">
                <GroupBadge group={p.group} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-900">{p.name}</p>
                  <p className="text-xs text-ink-500">
                    {p.condition} · {p.nextDue && new Date(p.nextDue + "T00:00:00").getTime() < new Date(new Date().toISOString().slice(0, 10) + "T00:00:00").getTime()
                      ? "overdue — request now"
                      : `due ${p.nextDue}`}
                  </p>
                </div>
                <Link href={`/request?patient=${p.id}`} className="shrink-0 rounded-lg bg-crimson-600 px-4 py-2 text-xs font-semibold text-white hover:bg-crimson-700 min-h-[44px] inline-flex items-center">
                  Request
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {critical.length > 0 && (
        <section aria-label="Critical requests" className="rounded-2xl border-2 border-crimson-600 bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-ink-900">Critical right now</h2>
            <Link href="/requests" className="text-sm font-semibold text-crimson-700 hover:underline">
              View all
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {critical.slice(0, 3).map((r) => (
              <li key={r.id} className="flex items-center gap-3 rounded-xl bg-crimson-50 px-4 py-3">
                <GroupBadge group={r.group} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-900">
                    {r.units} unit{r.units > 1 ? "s" : ""} · {r.hospital}
                  </p>
                  <p className="text-xs text-ink-500">{timeAgo(r.createdAt)} · {r.area}</p>
                </div>
                <a
                  href={`tel:${r.contactPhone.replace(/\s/g, "")}`}
                  className="rounded-lg bg-crimson-600 px-4 py-2 text-sm font-semibold text-white hover:bg-crimson-700"
                >
                  Call
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-label="Shortage alerts" className="rounded-2xl border border-amber-300 bg-amber-50 p-5 sm:p-6">
        <h2 className="text-base font-bold text-ink-900">Needed in your area right now</h2>
        <p className="mt-1 text-sm text-ink-600">
          Live shortage signal — groups where open demand outruns ready donors and bank stock.
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {alerts.map(({ need, level }) => (
            <li key={need.group} className="rounded-xl border border-amber-200 bg-white px-4 py-3">
              <div className="flex items-center gap-2">
                <GroupBadge group={need.group} />
                <span
                  className={`rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${
                    level === "shortage" ? "bg-crimson-600 text-white" : "bg-amber-100 text-amber-900"
                  }`}
                >
                  {level === "shortage" ? "Shortage" : "Watch"}
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold text-ink-900">
                {need.demandUnits} unit{need.demandUnits === 1 ? "" : "s"} needed
                <span className="font-normal text-ink-500"> · {need.readyDonors} ready donor{need.readyDonors === 1 ? "" : "s"}</span>
              </p>
              <p className="mt-0.5 text-xs text-ink-500">{needReason(need)}</p>
              <Link href="/donors/register" className="mt-2 inline-block text-sm font-semibold text-crimson-700 hover:underline">
                Register as a donor →
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Demand forecast" className="rounded-2xl border border-ink-200 bg-white p-5 sm:p-6">
        <h2 className="text-base font-bold text-ink-900">Demand forecast</h2>
        <p className="mt-1 text-sm text-ink-600">
          Blood demand follows the seasons. A unit donated 2–3 weeks before a peak helps far more than one donated after it.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {forecast.map((m) => {
            const badge = levelBadge(m.level);
            return (
              <div key={m.month} className="rounded-xl bg-ink-50 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-ink-900">{m.name}</p>
                  <span className={`rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${badge.cls}`}>
                    {badge.label}
                  </span>
                </div>
                <p className="mt-2 text-xs text-ink-600">{m.drivers.join(" · ")}</p>
                <p className="mt-2 text-xs font-medium text-ink-800">{m.tip}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section aria-label="Compatibility coverage" className="rounded-2xl border border-ink-200 bg-white p-5 sm:p-6">
        <h2 className="text-base font-bold text-ink-900">Who can cover each group tonight</h2>
        <p className="mt-1 text-sm text-ink-600">
          Ready, eligible donors whose blood can go to a patient of each group.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {groupCounts.map(({ group, count }) => (
            <div key={group} className="rounded-xl bg-ink-50 px-4 py-3">
              <GroupBadge group={group} size="sm" />
              <p className="tnum mt-2 text-2xl font-bold text-ink-900">{count}</p>
              <p className="text-xs text-ink-500">compatible donor{count === 1 ? "" : "s"}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link href="/request" className="rounded-2xl bg-crimson-600 p-6 text-white hover:bg-crimson-700">
          <h2 className="text-lg font-bold">Someone needs blood</h2>
          <p className="mt-1 text-sm text-crimson-100">
            Post a request in under a minute. We'll show you every compatible donor to call.
          </p>
          <span className="mt-4 inline-block rounded-lg bg-white px-4 py-2 text-sm font-semibold text-crimson-700">
            Post an emergency request
          </span>
        </Link>
        <Link href="/donors/register" className="rounded-2xl border border-ink-200 bg-white p-6 hover:bg-ink-50">
          <h2 className="text-lg font-bold text-ink-900">You can save a life</h2>
          <p className="mt-1 text-sm text-ink-600">
            Register as a donor, check your eligibility in 2 minutes, and get counted tonight.
          </p>
          <span className="mt-4 inline-block rounded-lg border border-ink-300 px-4 py-2 text-sm font-semibold text-ink-800">
            Register as a donor
          </span>
        </Link>
      </section>

      {fulfilled.length > 0 && (
        <section aria-label="Recently fulfilled">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-ink-900">Recently fulfilled</h2>
            <Link href="/requests" className="text-sm font-semibold text-crimson-700 hover:underline">
              All requests
            </Link>
          </div>
          <ul className="space-y-3">
            {fulfilled.map((r) => (
              <li key={r.id} className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-700 text-sm font-bold text-white" aria-hidden="true">
                  ✓
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-900">
                    {r.units} unit{r.units > 1 ? "s" : ""} of {r.group} → {r.patientName}
                  </p>
                  <p className="text-xs text-ink-500">{r.hospital} · {timeAgo(r.createdAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {open.length > 0 && (
        <section aria-label="Recent requests">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-ink-900">Latest requests</h2>
            <Link href="/requests" className="text-sm font-semibold text-crimson-700 hover:underline">
              All requests
            </Link>
          </div>
          <ul className="space-y-3">
            {open.slice(0, 3).map((r) => (
              <li key={r.id} className="flex items-center gap-3 rounded-2xl border border-ink-200 bg-white px-4 py-3">
                <GroupBadge group={r.group} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-900">
                    {r.patientName} · {r.hospital}
                  </p>
                  <p className="text-xs text-ink-500">{timeAgo(r.createdAt)} · {r.area}</p>
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
