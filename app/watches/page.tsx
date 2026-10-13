"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useDonors, useWatches, uid } from "@/lib/store";
import { BLOOD_GROUPS, freshWatchMatches, isRare } from "@/lib/blood";
import { EmptyState, GroupBadge, PageHeader } from "@/components/ui";
import type { BloodGroup } from "@/lib/types";

export default function Watches() {
  const [donors] = useDonors();
  const [watches, , addWatch, , removeWatch] = useWatches();
  const [group, setGroup] = useState<BloodGroup>("O-");
  const [area, setArea] = useState("");

  const hits = useMemo(() => freshWatchMatches(watches, donors), [watches, donors]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    addWatch({
      id: uid("watch"),
      group,
      area: area.trim(),
      createdAt: new Date().toISOString(),
    });
    setArea("");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Watch a blood group"
        subtitle="Waiting on a donor of a specific group? Set a watch — when a matching donor registers nearby, it shows up here."
      />

      {hits.length > 0 && (
        <section
          role="status"
          aria-label="Watchlist hits"
          className="rounded-[4px] border-2 border-signal bg-cream p-5"
        >
          <h2 className="text-base font-bold text-ember">
            {hits.length} new {hits.length === 1 ? "donor" : "donors"} match your watches
          </h2>
          <ul className="mt-3 space-y-2">
            {hits.slice(0, 5).map(({ watch, donor }) => (
              <li key={`${watch.id}:${donor.id}`} className="flex items-center gap-3 rounded-[3px] bg-cream px-4 py-2.5">
                <GroupBadge group={donor.group} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{donor.name}</p>
                  <p className="text-xs text-faint">
                    {donor.area} · matches your {watch.group}{watch.area ? ` / ${watch.area}` : ""} watch
                  </p>
                </div>
                <Link
                  href="/donors"
                  className="shrink-0 rounded-[3px] bg-signal px-3.5 py-2 text-xs font-semibold text-cream hover:bg-ember min-h-[44px] inline-flex items-center"
                >
                  View
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-[4px] border border-line bg-cream p-5">
        <h2 className="text-sm font-bold text-ink">New watch</h2>
        <form onSubmit={submit} className="mt-3 grid gap-3 sm:grid-cols-[140px_1fr_auto]">
          <select
            aria-label="Blood group to watch"
            value={group}
            onChange={(e) => setGroup(e.target.value as BloodGroup)}
            className="rounded-[3px] border border-line bg-cream px-3 py-2.5 text-sm font-medium min-h-[44px]"
          >
            {BLOOD_GROUPS.map((g) => (
              <option key={g} value={g}>{g}{isRare(g) ? " — rare" : ""}</option>
            ))}
          </select>
          <input
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="Area / locality (optional) — e.g. Guindy"
            aria-label="Area to watch"
            className="rounded-[3px] border border-line px-3 py-2.5 text-sm min-h-[44px]"
          />
          <button type="submit" className="rounded-[3px] bg-signal px-5 py-2.5 text-sm font-semibold text-cream hover:bg-ember min-h-[44px]">
            Watch
          </button>
        </form>
        <p className="mt-2 text-xs text-faint">
          Leave the area blank to match donors anywhere. Watches live in this browser only.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-bold text-ink">Your watches</h2>
        {watches.length === 0 ? (
          <EmptyState
            kind="search"
            title="No watches yet"
            body="Set a watch above — rare groups especially. You'll see new matching donors the moment they register."
          />
        ) : (
          <ul className="space-y-2">
            {watches.map((w) => {
              const count = hits.filter((h) => h.watch.id === w.id).length;
              return (
                <li key={w.id} className="flex items-center gap-3 rounded-[3px] border border-line bg-cream px-4 py-3">
                  <GroupBadge group={w.group} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">
                      {w.group}{w.area ? ` in ${w.area}` : " anywhere"}
                    </p>
                    <p className="text-xs text-faint">
                      {count > 0 ? `${count} new matching donor${count === 1 ? "" : "s"}` : "No new donors yet — last 14 days"}
                    </p>
                  </div>
                  <button
                    onClick={() => removeWatch(w.id)}
                    className="rounded-[3px] px-3 py-1.5 text-xs font-semibold text-faint hover:bg-cream hover:text-signal min-h-[44px]"
                  >
                    Remove
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
