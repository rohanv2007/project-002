"use client";

import { useMemo, useState } from "react";
import { useBanks, uid } from "@/lib/store";
import { BLOOD_GROUPS, isRare, timeAgo } from "@/lib/blood";
import { EmptyState, Field, GroupBadge, PageHeader, inputCls } from "@/components/ui";
import type { BloodBank, BloodGroup } from "@/lib/types";

function StockBar({ units }: { units: number }) {
  const level = units === 0 ? "empty" : units <= 2 ? "low" : units <= 8 ? "ok" : "good";
  const color = {
    empty: "bg-line",
    low: "bg-cream0",
    ok: "bg-gold",
    good: "bg-moss",
  }[level];
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-16 overflow-hidden rounded-full bg-sand" aria-hidden="true">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, units * 8)}%` }} />
      </div>
      <span className={`tnum text-xs font-bold ${units <= 2 ? "text-signal" : "text-soot"}`}>
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
        <section aria-label="Rare blood alerts" className="rounded-[4px] border border-line bg-cream p-5">
          <h2 className="text-sm font-bold text-gold">Low stock on rare groups</h2>
          <ul className="mt-2 space-y-1 text-sm text-gold">
            {rareAlerts.map(({ bank, group: g }) => (
              <li key={`${bank.id}-${g}`}>
                <GroupBadge group={g} size="sm" /> {bank.name} — {bank.stock[g]} unit{bank.stock[g] === 1 ? "" : "s"} left
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-gold">
            Rare-group donors (O−, A−, B−, AB−): this is exactly when you're needed most.
          </p>
        </section>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="bank-group" className="text-sm font-medium text-soot">Sort by group</label>
        <select
          id="bank-group"
          value={group}
          onChange={(e) => setGroup(e.target.value as BloodGroup | "all")}
          className="rounded-[3px] border border-line bg-cream px-3 py-2 text-sm font-medium min-h-[44px]"
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
          className="rounded-[3px] border border-line bg-cream px-3 py-2 text-sm min-h-[44px] w-44"
        />
        <label className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-[3px] border border-line bg-cream px-3 py-2 text-sm font-medium text-soot">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className="h-4 w-4 accent-[#c93e1c]"
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
              <article key={b.id} className="rounded-[4px] border border-line bg-cream p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-[24px] font-semibold tracking-tight text-ink">{b.name}</h2>
                    <p className="text-xs text-faint">{b.area} · {b.hours}</p>
                    {stale && (
                      <span
                        className="mt-1.5 inline-block rounded-[3px] bg-cream px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gold ring-1 ring-inset ring-line"
                        title="No stock update in over 30 days — these numbers may be out of date. Call the bank before travelling."
                      >
                        Stock may be stale — call to confirm
                      </span>
                    )}
                  </div>
                  <a
                    href={`tel:${b.phone.replace(/[\s-]/g, "")}`}
                    className="rounded-[3px] bg-sand px-3 py-2 text-xs font-semibold text-soot hover:bg-sand min-h-[44px] inline-flex items-center tnum"
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
                            className="flex h-11 w-11 items-center justify-center rounded-[3px] border border-line text-lg font-bold text-soot hover:bg-paper disabled:opacity-30"
                          >
                            −
                          </button>
                          <span className="tnum w-7 text-center text-sm font-bold text-ink" aria-live="polite">
                            {b.stock[g]}
                          </span>
                          <button
                            onClick={() => bump(b, g, 1)}
                            aria-label={`Increase ${g} stock at ${b.name}`}
                            className="flex h-11 w-11 items-center justify-center rounded-[3px] border border-line text-lg font-bold text-soot hover:bg-paper"
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
                <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3">
                  <p className="tnum text-xs font-semibold text-soot">
                    {total} units in stock{b.updatedAt ? ` · updated ${timeAgo(b.updatedAt)}` : ""}
                  </p>
                  {editingId === b.id ? (
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded-[3px] bg-ink px-4 py-2 text-xs font-semibold text-cream hover:bg-ink min-h-[44px]"
                    >
                      Done
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      {stale && (
                        <button
                          onClick={() => updateBank(b.id, { updatedAt: new Date().toISOString() })}
                          className="rounded-[3px] border border-line px-4 py-2 text-xs font-semibold text-ink hover:bg-paper min-h-[44px]"
                          title="You called and the numbers still hold — refreshes the freshness stamp without changing stock."
                        >
                          Confirm stock
                        </button>
                      )}
                      <button
                        onClick={() => setEditingId(b.id)}
                        className="rounded-[3px] border border-line px-4 py-2 text-xs font-semibold text-ink hover:bg-paper min-h-[44px]"
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

      <div className="border-t border-line pt-5">
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-[3px] border border-dashed border-line px-5 py-3 text-sm font-semibold text-soot hover:bg-cream min-h-[44px] w-full sm:w-auto"
          >
            + Add a blood bank
          </button>
        ) : (
          <section aria-label="Add a blood bank" className="rounded-[4px] border border-line bg-cream p-5 sm:p-6">
            <h2 className="font-display text-[24px] font-semibold tracking-tight text-ink">Add a blood bank</h2>
            <p className="mt-1 text-sm text-soot">
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
                <legend className="mb-2 text-sm font-medium text-ink">Units in stock today</legend>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {BLOOD_GROUPS.map((g) => (
                    <label key={g} className="flex items-center justify-between gap-2 rounded-[3px] bg-paper px-3 py-2">
                      <span className="text-sm font-bold text-ink">{g}</span>
                      <input
                        type="number"
                        min={0}
                        max={999}
                        value={newStock[g]}
                        onChange={(e) => setNewStock((s) => ({ ...s, [g]: Math.max(0, Number(e.target.value) || 0) }))}
                        aria-label={`${g} units in stock`}
                        className="tnum w-20 rounded-[3px] border border-line bg-cream px-2 py-1.5 text-sm min-h-[44px]"
                      />
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="flex flex-wrap gap-2">
                <button type="submit" className="rounded-[3px] bg-signal px-5 py-2.5 text-sm font-semibold text-cream hover:bg-ember min-h-[44px]">
                  Add blood bank
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-[3px] border border-line px-5 py-2.5 text-sm font-semibold text-soot hover:bg-paper min-h-[44px]"
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
