"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useDonors, useRequests } from "@/lib/store";
import { BLOOD_GROUPS, COMPATIBLE_DONORS, isComponentUrgent, isEffectivelyAvailable, isEligibleByInterval, timeAgo, timeUntil } from "@/lib/blood";
import { EmptyState, GroupBadge, PageHeader, UrgencyBadge } from "@/components/ui";
import type { BloodGroup } from "@/lib/types";

type Tab = "open" | "fulfilled" | "expired";

export default function RequestsBoard() {
  const [requests, , , updateRequest] = useRequests();
  const [donors] = useDonors();
  const [tab, setTab] = useState<Tab>("open");
  const [group, setGroup] = useState<BloodGroup | "all">("all");
  const [query, setQuery] = useState("");

  // Ready-donor supply per group: registered donors whose blood can go to
  // each group, available and past their 90-day interval. Families see at a
  // glance whether the network can cover this request.
  const readyCounts = useMemo(() => {
    const counts = {} as Record<BloodGroup, number>;
    for (const g of BLOOD_GROUPS) {
      counts[g] = donors.filter(
        (d) =>
          COMPATIBLE_DONORS[g].includes(d.group) &&
          isEffectivelyAvailable(d) &&
          isEligibleByInterval(d.lastDonation)
      ).length;
    }
    return counts;
  }, [donors]);

  // Sweep: expire anything past its deadline
  useEffect(() => {
    const now = new Date();
    requests.forEach((r) => {
      if (r.status === "open" && new Date(r.expiresAt) <= now) updateRequest(r.id, { status: "expired" });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = useMemo(() => {
    const now = new Date();
    return {
      open: requests.filter((r) => r.status === "open" && new Date(r.expiresAt) > now).length,
      fulfilled: requests.filter((r) => r.status === "fulfilled").length,
      expired: requests.filter((r) => r.status === "expired" || (r.status === "open" && new Date(r.expiresAt) <= now)).length,
    };
  }, [requests]);

  const normHospital = (h: string) => h.trim().toLowerCase().replace(/\s+/g, " ");

  const list = useMemo(() => {
    const now = new Date();
    const q = query.trim().toLowerCase();
    const filtered = requests.filter((r) => {
      const live = r.status === "open" && new Date(r.expiresAt) > now;
      if (tab === "open" && !live) return false;
      if (tab === "fulfilled" && r.status !== "fulfilled") return false;
      if (tab === "expired" && (live || r.status === "fulfilled")) return false;
      if (group !== "all" && r.group !== group) return false;
      if (q && !`${r.patientName} ${r.hospital} ${r.area}`.toLowerCase().includes(q)) return false;
      return true;
    });

    // Duplicate detection: same group + same hospital posted within 24h.
    // A second family member often re-posts the same emergency.
    const duplicateOf = new Map<string, string>();
    const open = filtered.filter((r) => r.status === "open");
    for (let i = 0; i < open.length; i++) {
      for (let j = i + 1; j < open.length; j++) {
        const a = open[i], b = open[j];
        if (a.group !== b.group) continue;
        if (normHospital(a.hospital) !== normHospital(b.hospital)) continue;
        const dt = Math.abs(+new Date(a.createdAt) - +new Date(b.createdAt));
        if (dt > 24 * 3600_000) continue;
        const [older, newer] = +new Date(a.createdAt) <= +new Date(b.createdAt) ? [a, b] : [b, a];
        duplicateOf.set(newer.id, older.id);
      }
    }

    // Priority sort on the open tab: critical first, then time-critical
    // platelet requests (they can't be stocked), then expiring soonest,
    // then newest. Fulfilled/expired stay newest-first.
    const rank = { critical: 0, urgent: 1, scheduled: 2 } as const;
    const sorted = [...filtered].sort((a, b) =>
      tab === "open"
        ? rank[a.urgency] - rank[b.urgency] ||
          (isComponentUrgent(b.component) ? 1 : 0) - (isComponentUrgent(a.component) ? 1 : 0) ||
          +new Date(a.expiresAt) - +new Date(b.expiresAt) ||
          +new Date(b.createdAt) - +new Date(a.createdAt)
        : +new Date(b.createdAt) - +new Date(a.createdAt)
    );
    return { items: sorted, duplicateOf };
  }, [requests, tab, group, query]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "open", label: `Open (${counts.open})` },
    { id: "fulfilled", label: `Fulfilled (${counts.fulfilled})` },
    { id: "expired", label: `Expired (${counts.expired})` },
  ];

  return (
    <div>
      <PageHeader
        title="Blood requests"
        subtitle="Every active request in the network. Critical ones surface first — a fulfilled request is one less family in crisis."
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex rounded-[3px] bg-sand p-1" role="tablist" aria-label="Request status">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-[3px] px-4 py-2 text-sm font-semibold min-h-[44px] ${
                tab === t.id ? "bg-cream text-ink shadow-sm" : "text-faint hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <select
          aria-label="Filter by blood group"
          value={group}
          onChange={(e) => setGroup(e.target.value as BloodGroup | "all")}
          className="rounded-[3px] border border-line bg-cream px-3 py-2 text-sm font-medium min-h-[44px]"
        >
          <option value="all">All groups</option>
          {BLOOD_GROUPS.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <input
          type="search"
          aria-label="Search by patient, hospital, or area"
          placeholder="Search hospital, area, patient…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-[3px] border border-line bg-cream px-3.5 py-2 text-sm text-ink placeholder:text-faint focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal min-h-[44px] sm:w-56"
        />
      </div>

      <p aria-live="polite" role="status" className="sr-only">
        {list.items.length} {list.items.length === 1 ? "request" : "requests"} shown
      </p>

      {list.items.length === 0 ? (
        <EmptyState
          kind={tab === "open" ? "flag" : "search"}
          title={tab === "open" ? "No open requests" : `No ${tab} requests`}
          body={tab === "open" ? "Quiet right now — that's good news. When an emergency lands, it will appear here first." : "No requests here — the fulfilled ones went to patients, which is the whole point."}
          action={tab === "open" ? <Link href="/request" className="rounded-[3px] bg-signal px-5 py-2.5 text-sm font-semibold text-cream">Post a request</Link> : undefined}
        />
      ) : (
        <ul className="space-y-3">
          {list.items.map((r) => {
            const until = r.status === "open" ? timeUntil(r.expiresAt) : null;
            const dupId = list.duplicateOf.get(r.id);
            const supply = readyCounts[r.group];
            const pledged = (r.pledges ?? []).reduce((s, p) => s + p.units, 0);
            const pct = Math.min(100, Math.round((pledged / Math.max(1, r.units)) * 100));
            const met = pledged >= r.units;
            return (
            <li key={r.id}>
              <Link
                href={`/requests/${r.id}`}
                className="flex items-center gap-3 rounded-[4px] border border-line bg-cream px-4 py-4 hover:border-signal hover:bg-cream/40"
              >
                <GroupBadge group={r.group} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">
                    {r.patientName} · {r.units} unit{r.units > 1 ? "s" : ""}
                  </p>
                  <p className="truncate text-xs text-faint">
                    {r.hospital}, {r.area} · {timeAgo(r.createdAt)}
                    {until && (
                      <span className={`font-semibold ${until.urgent ? "text-signal" : ""}`}>
                        {" · "}{until.text}
                      </span>
                    )}
                    {tab === "open" && (
                      <span className={`font-semibold ${supply > 0 ? "text-moss" : "text-signal"}`}>
                        {" · "}{supply} ready donor{supply === 1 ? "" : "s"}
                      </span>
                    )}
                  </p>
                  {(pledged > 0 || tab === "open") && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <div
                        className="h-1.5 flex-1 overflow-hidden rounded-full bg-sand"
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${pledged} of ${r.units} units pledged`}
                      >
                        <div className={`h-full rounded-full ${met ? "bg-moss" : "bg-cream0"}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className={`tnum shrink-0 text-[11px] font-bold ${met ? "text-moss" : "text-faint"}`}>
                        {met ? "Fully pledged" : `${pledged}/${r.units}u`}
                      </span>
                    </div>
                  )}
                </div>
                <span className="flex shrink-0 flex-col items-end gap-1.5">
                  <UrgencyBadge urgency={r.urgency} />
                  {dupId && (
                    <span
                      className="rounded-[3px] bg-cream px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gold ring-1 ring-inset ring-line"
                      title="Same blood group and hospital posted within 24 hours — this may be a repeat of the same emergency. Open the older request instead."
                    >
                      Possible duplicate
                    </span>
                  )}
                </span>
              </Link>
            </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
