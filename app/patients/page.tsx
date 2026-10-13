"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePatients, uid } from "@/lib/store";
import { BLOOD_GROUPS, formatDate, isRare } from "@/lib/blood";
import { EmptyState, GroupBadge, PageHeader } from "@/components/ui";
import type { BloodGroup } from "@/lib/types";

const CONDITIONS = ["Thalassemia", "Dialysis (kidney)", "Sickle cell disease", "Cancer treatment", "Other chronic need"];

function daysUntil(iso: string): number {
  const a = new Date();
  a.setHours(0, 0, 0, 0);
  const b = new Date(iso + "T00:00:00");
  return Math.round((b.getTime() - a.getTime()) / 86400_000);
}

export default function Patients() {
  const [patients, , addPatient, updatePatient, removePatient] = usePatients();
  const [name, setName] = useState("");
  const [group, setGroup] = useState<BloodGroup>("O+");
  const [condition, setCondition] = useState(CONDITIONS[0]);
  const [hospital, setHospital] = useState("");
  const [area, setArea] = useState("");
  const [nextDue, setNextDue] = useState("");
  const [showForm, setShowForm] = useState(false);
  // Per-patient "mark done" interval — transfusion cycles genuinely vary
  // (thalassemia ~3 weeks, dialysis ~4–6), so the 21-day hardcode was wrong.
  const [dueWeeks, setDueWeeks] = useState<Record<string, number>>({});
  const weeksFor = (id: string) => dueWeeks[id] ?? 3;

  const sorted = useMemo(
    () =>
      [...patients].sort((a, b) => {
        if (a.nextDue && b.nextDue) return a.nextDue.localeCompare(b.nextDue);
        if (a.nextDue) return -1;
        if (b.nextDue) return 1;
        return b.createdAt.localeCompare(a.createdAt);
      }),
    [patients]
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2 || hospital.trim().length < 2) return;
    addPatient({
      id: uid("patient"),
      name: name.trim(),
      group,
      condition,
      hospital: hospital.trim(),
      area: area.trim(),
      nextDue: nextDue || null,
      createdAt: new Date().toISOString(),
    });
    setName(""); setHospital(""); setArea(""); setNextDue("");
    setShowForm(false);
  };

  const pushDue = (id: string, days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    updatePatient(id, { nextDue: d.toISOString().slice(0, 10) });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Transfusion patients"
        subtitle="For thalassemia, dialysis and other recurring needs — keep the details on file so each cycle's request takes seconds, not an hour."
      />

      <button
        onClick={() => setShowForm((s) => !s)}
        className="w-full rounded-[3px] border-2 border-dashed border-line bg-cream px-5 py-3.5 text-sm font-semibold text-soot hover:border-signal hover:text-signal min-h-[44px]"
      >
        {showForm ? "Close form" : "+ Add a patient profile"}
      </button>

      {showForm && (
        <form onSubmit={submit} className="space-y-4 rounded-[4px] border border-line bg-cream p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-faint">Patient name</span>
              <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. K. Meena" className="w-full rounded-[3px] border border-line px-3 py-2.5 text-sm min-h-[44px]" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-faint">Blood group</span>
              <select value={group} onChange={(e) => setGroup(e.target.value as BloodGroup)} className="w-full rounded-[3px] border border-line bg-cream px-3 py-2.5 text-sm min-h-[44px]">
                {BLOOD_GROUPS.map((g) => (
                  <option key={g} value={g}>{g}{isRare(g) ? " — rare" : ""}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-faint">Condition</span>
              <select value={condition} onChange={(e) => setCondition(e.target.value)} className="w-full rounded-[3px] border border-line bg-cream px-3 py-2.5 text-sm min-h-[44px]">
                {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-faint">Next transfusion due</span>
              <input type="date" value={nextDue} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setNextDue(e.target.value)} className="w-full rounded-[3px] border border-line px-3 py-2.5 text-sm min-h-[44px]" />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-faint">Hospital</span>
              <input required value={hospital} onChange={(e) => setHospital(e.target.value)} placeholder="e.g. Govt. Hospital, Sriperumbudur" className="w-full rounded-[3px] border border-line px-3 py-2.5 text-sm min-h-[44px]" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-faint">Area / locality</span>
              <input value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. Thandalam" className="w-full rounded-[3px] border border-line px-3 py-2.5 text-sm min-h-[44px]" />
            </label>
          </div>
          <button type="submit" className="w-full rounded-[3px] bg-signal px-6 py-3 text-sm font-semibold text-cream hover:bg-ember min-h-[44px]">
            Save patient profile
          </button>
        </form>
      )}

      {sorted.length === 0 ? (
        <EmptyState
          kind="people"
          title="No patient profiles yet"
          body="Add the recurring patients your family or community supports — their next request will pre-fill from here."
        />
      ) : (
        <ul className="space-y-3">
          {sorted.map((p) => {
            const d = p.nextDue ? daysUntil(p.nextDue) : null;
            const dueSoon = d !== null && d <= 7;
            return (
              <li key={p.id} className={`rounded-[4px] border bg-cream p-4 ${dueSoon ? "border-line" : "border-line"}`}>
                <div className="flex items-start gap-3">
                  <GroupBadge group={p.group} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">{p.name}</p>
                    <p className="text-xs text-faint">{p.condition} · {p.hospital}{p.area ? `, ${p.area}` : ""}</p>
                    {p.nextDue && (
                      <p className={`mt-1 text-xs font-semibold ${dueSoon ? "text-gold" : "text-soot"}`}>
                        {d! < 0
                          ? `Was due ${formatDate(p.nextDue)} — overdue`
                          : d === 0
                            ? "Due today"
                            : d === 1
                              ? "Due tomorrow"
                              : `Due in ${d} days (${formatDate(p.nextDue)})`}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/request?patient=${p.id}`}
                    className="rounded-[3px] bg-signal px-4 py-2 text-xs font-semibold text-cream hover:bg-ember min-h-[44px] inline-flex items-center"
                  >
                    New request for {p.name.split(" ")[0]}
                  </Link>
                  <span className="inline-flex items-center gap-1.5 rounded-[3px] border border-line py-1 pl-3 pr-1">
                    <button
                      onClick={() => pushDue(p.id, weeksFor(p.id) * 7)}
                      className="min-h-[44px] rounded px-1 py-2 text-xs font-semibold text-ink hover:bg-paper"
                    >
                      Mark done — next in
                    </button>
                    <select
                      value={weeksFor(p.id)}
                      onChange={(e) => setDueWeeks((m) => ({ ...m, [p.id]: Number(e.target.value) }))}
                      aria-label={`Weeks until ${p.name}'s next transfusion`}
                      className="min-h-[44px] rounded-[3px] border border-line bg-cream px-1.5 py-1.5 text-xs font-semibold"
                    >
                      {[2, 3, 4, 6, 8].map((w) => (
                        <option key={w} value={w}>{w} wk</option>
                      ))}
                    </select>
                  </span>
                  <button
                    onClick={() => { if (window.confirm(`Remove ${p.name}'s profile?`)) removePatient(p.id); }}
                    className="rounded-[3px] px-3 py-2 text-xs font-semibold text-faint hover:bg-cream hover:text-signal min-h-[44px]"
                  >
                    Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
