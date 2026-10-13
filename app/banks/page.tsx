"use client";

import { useMemo, useState } from "react";
import { useBanks, uid } from "@/lib/store";
import { BLOOD_GROUPS, isRare, timeAgo } from "@/lib/blood";
import { EmptyState, Field, GroupBadge, PageHeader, inputCls } from "@/components/ui";
import type { BloodBank, BloodGroup } from "@/lib/types";

function StockBar({ units }: { units: number }) {
  const level = units === 0 ? "empty" : units <= 2 ? "low" : units <= 8 ? "ok" : "good";
  const color = {
    empty: "bg-ink-200",
    low: "bg-crimson-500",
    ok: "bg-amber-400",
    good: "bg-green-600",
  }[level];
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-16 overflow-hidden rounded-full bg-ink-100" aria-hidden="true">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, units * 8)}%` }} />
      </div>
      <span className={`tnum text-xs font-bold ${units <= 2 ? "text-crimson-700" : "text-ink-700"}`}>
        {units}
      </span>
    </div>
  );
}

export default function Banks() {
  const [banks, , addBank, updateBank] = useBanks();
  const [group, setGroup] = useState<BloodGroup | "all">("all");
  const [areaQ, setAreaQ] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [phone, setPhone] = useState("");
  const [hours, setHours] = useState("");
  const [newStock, setNewStock] = useState<Record<BloodGroup, number>>(() =>
    Object.fromEntries(BLOOD_GROUPS.map((g) => [g, 0])) as Record<BloodGroup, number>
  );

  const submitBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !area.trim() || !phone.trim()) return;
    addBank({
      id: uid("bank"),
      name: name.trim(),
      area: area.trim(),
      phone: phone.trim(),
      hours: hours.trim() || "Hours not listed — call to confirm",
      stock: { ...newStock },
      updatedAt: new Date().toISOString(),
    });
    setName(""); setArea(""); setPhone(""); setHours("");
    setNewStock(Object.fromEntries(BLOOD_GROUPS.map((g) => [g, 0])) as Record<BloodGroup, number>);
    setShowForm(false);
  };

  const bump = (b: BloodBank, g: BloodGroup, delta: number) => {
    updateBank(b.id, {
      stock: { ...b.stock, [g]: Math.max(0, b.stock[g] + delta) },
      updatedAt: new Date().toISOString(),
    });
  };

  const sorted = useMemo(() => {
    const q = areaQ.trim().toLowerCase();
    let list = banks.filter(
      (b) =>
        (!q || b.name.toLowerCase().includes(q) || b.area.toLowerCase().includes(q)) &&
        (!inStockOnly ||
          (group === "all"
            ? Object.values(b.stock).some((n) => n > 0)
            : b.stock[group] > 0))
    );
    if (group !== "all") list = [...list].sort((a, b) => b.stock[group] - a.stock[group]);
    return list;
  }, [banks, group, areaQ, inStockOnly]);

  const rareAlerts = useMemo(() => {
    const out: { bank: BloodBank; group: BloodGroup }[] = [];
    for (const b of banks)
      for (const g of BLOOD_GROUPS)
        if (isRare(g) && b.stock[g] <= 2) out.push({ bank: b, group: g });
    return out;
  }, [banks]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blood bank stock"
        subtitle="What nearby blood banks hold right now. Banks update stock after every collection — call before you travel."
      />

      {rareAlerts.length > 0 && (
        <section aria-label="Rare blood alerts" className="rounded-2xl border border-amber-300 bg-amber-50 p-5">
          <h2 className="text-sm font-bold text-amber-900">Low stock on rare groups</h2>
          <ul className="mt-2 space-y-1 text-sm text-amber-900">
            {rareAlerts.map(({ bank, group: g }) => (
              <li key={`${bank.id}-${g}`}>
                <GroupBadge group={g} size="sm" /> {bank.name} — {bank.stock[g]} unit{bank.stock[g] === 1 ? "" : "s"} left
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-amber-800">
            Rare-group donors (O−, A−, B−, AB−): this is exactly when you're needed most.
          </p>
        </section>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="bank-group" className="text-sm font-medium text-ink-700">Sort by group</label>
        <select
          id="bank-group"
          value={group}
          onChange={(e) => setGroup(e.target.value as BloodGroup | "all")}
          className="rounded-xl border border-ink-300 bg-white px-3 py-2 text-sm font-medium min-h-[44px]"
        >
          <option value="all">All groups</option>
          {BLOOD_GROUPS.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <label htmlFor="bank-area" className="sr-only">Filter by locality</label>
        <input
          id="bank-area"
          type="search"
          value={areaQ}
          onChange={(e) => setAreaQ(e.target.value)}
          placeholder="Filter by locality…"
          className="rounded-xl border border-ink-300 bg-white px-3 py-2 text-sm min-h-[44px] w-44"
        />
        <label className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-ink-300 bg-white px-3 py-2 text-sm font-medium text-ink-700">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className="h-4 w-4 accent-[#b91c2e]"
          />
          In stock only
        </label>
      </div>

      {sorted.length === 0 ? (
        <EmptyState kind="bank" title={banks.length === 0 ? "No blood banks listed" : "No banks match these filters"} body={banks.length === 0 ? "Blood bank data hasn't been added for this area yet." : "Try clearing the locality filter or unchecking \u201cIn stock only\u201d."} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sorted.map((b) => {
            const total = Object.values(b.stock).reduce((a, n) => a + n, 0);
            const stale = b.updatedAt
              ? Date.now() - new Date(b.updatedAt).getTime() > 30 * 24 * 3600 * 1000
              : true;
            return (
              <article key={b.id} className="rounded-2xl border border-ink-200 bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-ink-900">{b.name}</h2>
                    <p className="text-xs text-ink-500">{b.area} · {b.hours}</p>
                    {stale && (
                      <span
                        className="mt-1.5 inline-block rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-900 ring-1 ring-inset ring-amber-300"
                        title="No stock update in over 30 days — these numbers may be out of date. Call the bank before travelling."
                      >
                        Stock may be stale — call to confirm
                      </span>
                    )}
                  </div>
                  <a
                    href={`tel:${b.phone.replace(/[\s-]/g, "")}`}
                    className="rounded-lg bg-ink-100 px-3 py-2 text-xs font-semibold text-ink-700 hover:bg-ink-200 min-h-[44px] inline-flex items-center tnum"
                  >
                    {b.phone}
                  </a>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5">
                  {BLOOD_GROUPS.map((g) => (
                    <div key={g} className="flex items-center justify-between gap-2">
                      <GroupBadge group={g} size="sm" />
                      {editingId === b.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => bump(b, g, -1)}
                            aria-label={`Decrease ${g} stock at ${b.name}`}
                            disabled={b.stock[g] <= 0}
                            className="flex h-11 w-11 items-center justify-center rounded-lg border border-ink-300 text-lg font-bold text-ink-700 hover:bg-ink-50 disabled:opacity-30"
                          >
                            −
                          </button>
                          <span className="tnum w-7 text-center text-sm font-bold text-ink-900" aria-live="polite">
                            {b.stock[g]}
                          </span>
                          <button
                            onClick={() => bump(b, g, 1)}
                            aria-label={`Increase ${g} stock at ${b.name}`}
                            className="flex h-11 w-11 items-center justify-center rounded-lg border border-ink-300 text-lg font-bold text-ink-700 hover:bg-ink-50"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <StockBar units={b.stock[g]} />
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between gap-2 border-t border-ink-100 pt-3">
                  <p className="tnum text-xs font-semibold text-ink-600">
                    {total} units in stock{b.updatedAt ? ` · updated ${timeAgo(b.updatedAt)}` : ""}
                  </p>
                  {editingId === b.id ? (
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded-lg bg-ink-900 px-4 py-2 text-xs font-semibold text-white hover:bg-ink-700 min-h-[44px]"
                    >
                      Done
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      {stale && (
                        <button
                          onClick={() => updateBank(b.id, { updatedAt: new Date().toISOString() })}
                          className="rounded-lg border border-ink-300 px-4 py-2 text-xs font-semibold text-ink-800 hover:bg-ink-50 min-h-[44px]"
                          title="You called and the numbers still hold — refreshes the freshness stamp without changing stock."
                        >
                          Confirm stock
                        </button>
                      )}
                      <button
                        onClick={() => setEditingId(b.id)}
                        className="rounded-lg border border-ink-300 px-4 py-2 text-xs font-semibold text-ink-800 hover:bg-ink-50 min-h-[44px]"
                      >
                        Update stock
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="border-t border-ink-200 pt-5">
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-xl border border-dashed border-ink-300 px-5 py-3 text-sm font-semibold text-ink-700 hover:bg-white min-h-[44px] w-full sm:w-auto"
          >
            + Add a blood bank
          </button>
        ) : (
          <section aria-label="Add a blood bank" className="rounded-2xl border border-ink-200 bg-white p-5 sm:p-6">
            <h2 className="text-base font-bold text-ink-900">Add a blood bank</h2>
            <p className="mt-1 text-sm text-ink-600">
              Know a bank that's missing? Add it — enter today's stock levels and it joins the board instantly.
            </p>
            <form onSubmit={submitBank} className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Blood bank name">
                  <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} placeholder="e.g. City Blood Centre" className={inputCls} />
                </Field>
                <Field label="Area">
                  <input value={area} onChange={(e) => setArea(e.target.value)} required maxLength={60} placeholder="e.g. Guindy" className={inputCls} />
                </Field>
                <Field label="Phone">
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} required maxLength={20} placeholder="+91 ..." className={inputCls} />
                </Field>
                <Field label="Opening hours (optional)">
                  <input value={hours} onChange={(e) => setHours(e.target.value)} maxLength={60} placeholder="e.g. All days, 9 AM – 7 PM" className={inputCls} />
                </Field>
              </div>
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-ink-800">Units in stock today</legend>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {BLOOD_GROUPS.map((g) => (
                    <label key={g} className="flex items-center justify-between gap-2 rounded-xl bg-ink-50 px-3 py-2">
                      <span className="text-sm font-bold text-ink-900">{g}</span>
                      <input
                        type="number"
                        min={0}
                        max={999}
                        value={newStock[g]}
                        onChange={(e) => setNewStock((s) => ({ ...s, [g]: Math.max(0, Number(e.target.value) || 0) }))}
                        aria-label={`${g} units in stock`}
                        className="tnum w-20 rounded-lg border border-ink-300 bg-white px-2 py-1.5 text-sm min-h-[44px]"
                      />
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="flex flex-wrap gap-2">
                <button type="submit" className="rounded-xl bg-crimson-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-crimson-700 min-h-[44px]">
                  Add blood bank
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl border border-ink-300 px-5 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-50 min-h-[44px]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}
      </div>
    </div>
  );
}
