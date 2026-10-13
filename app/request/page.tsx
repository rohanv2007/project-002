"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePatients, useRequests, uid } from "@/lib/store";
import { BLOOD_GROUPS, RARE_PHENOTYPES, isComponentUrgent, isRare, isValidIndianMobile, normalizeIndianPhone } from "@/lib/blood";
import { Field, PageHeader, inputCls } from "@/components/ui";
import { BLOOD_COMPONENTS } from "@/lib/types";
import type { BloodComponent, BloodGroup } from "@/lib/types";

const URGENCIES = [
  { value: "critical", label: "Critical — needed within hours", hours: 24 },
  { value: "urgent", label: "Urgent — needed within a day or two", hours: 48 },
  { value: "scheduled", label: "Scheduled — planned transfusion", hours: 96 },
] as const;

const DRAFT_KEY = "raktha.request.draft.v1";
const URGENCY_VALUES = URGENCIES.map((u) => u.value);

interface RequestDraft {
  patientName?: string;
  group?: BloodGroup;
  units?: number;
  component?: BloodComponent;
  hospital?: string;
  area?: string;
  contactName?: string;
  contactPhone?: string;
  urgency?: "critical" | "urgent" | "scheduled";
  notes?: string;
}

export default function RequestBlood() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl"><p className="text-sm text-ink-500">Loading…</p></div>}>
      <RequestForm />
    </Suspense>
  );
}

function RequestForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, , addRequest] = useRequests();
  const [patients] = usePatients();
  const [patientPrefill, setPatientPrefill] = useState<string | null>(null);
  const [patientName, setPatientName] = useState("");
  const [group, setGroup] = useState<BloodGroup>("O+");
  const [units, setUnits] = useState(1);
  const [component, setComponent] = useState<BloodComponent>("whole");
  const [hospital, setHospital] = useState("");
  const [area, setArea] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [urgency, setUrgency] = useState<"critical" | "urgent" | "scheduled">("urgent");
  const [notes, setNotes] = useState("");
  const [rarePhenotypeNeeded, setRarePhenotypeNeeded] = useState("");
  const [error, setError] = useState("");
  const [draftRestored, setDraftRestored] = useState(false);

  // Restore an interrupted draft on mount — emergencies get interrupted.
  // A ?patient=<id> link from the patients page wins over the draft.
  useEffect(() => {
    const pid = searchParams.get("patient");
    if (pid) {
      const p = patients.find((x) => x.id === pid);
      if (p) {
        setPatientName(p.name);
        setGroup(p.group);
        setHospital(p.hospital);
        setArea(p.area);
        setUrgency("scheduled");
        setNotes(`${p.condition} — recurring transfusion.`);
        setPatientPrefill(p.name);
        return;
      }
    }
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw) as RequestDraft;
      const hasContent = [d.patientName, d.hospital, d.area, d.contactName, d.contactPhone, d.notes].some(
        (v) => typeof v === "string" && v.trim().length > 0
      );
      if (!hasContent) return;
      if (typeof d.patientName === "string") setPatientName(d.patientName);
      if (d.group && BLOOD_GROUPS.includes(d.group)) setGroup(d.group);
      if (typeof d.units === "number" && d.units >= 1 && d.units <= 10) setUnits(d.units);
      if (d.component && BLOOD_COMPONENTS.includes(d.component)) setComponent(d.component);
      if (typeof d.hospital === "string") setHospital(d.hospital);
      if (typeof d.area === "string") setArea(d.area);
      if (typeof d.contactName === "string") setContactName(d.contactName);
      if (typeof d.contactPhone === "string") setContactPhone(d.contactPhone);
      if (d.urgency && URGENCY_VALUES.includes(d.urgency)) setUrgency(d.urgency);
      if (typeof d.notes === "string") setNotes(d.notes);
      setDraftRestored(true);
    } catch {
      // corrupt draft — start fresh
    }
  }, []);

  // Autosave every keystroke so an interruption never loses the details.
  useEffect(() => {
    try {
      window.localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ patientName, group, units, component, hospital, area, contactName, contactPhone, urgency, notes })
      );
    } catch {
      // storage unavailable — form still works
    }
  }, [patientName, group, units, component, hospital, area, contactName, contactPhone, urgency, notes]);

  const clearDraft = () => {
    try {
      window.localStorage.removeItem(DRAFT_KEY);
    } catch {
      // ignore
    }
    setDraftRestored(false);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (patientName.trim().length < 2) return setError("Please enter the patient's name.");
    if (!hospital.trim()) return setError("Please enter the hospital name.");
    if (!area.trim()) return setError("Please enter the area / locality.");
    if (contactName.trim().length < 2) return setError("Please enter a contact person's name.");
    if (!isValidIndianMobile(contactPhone)) return setError("Please enter a valid 10-digit Indian mobile number (starting 6–9).");
    setError("");
    const hours = URGENCIES.find((u) => u.value === urgency)!.hours;
    const id = uid("req");
    addRequest({
      id,
      patientName: patientName.trim(),
      group,
      units: Math.max(1, Math.min(10, units)),
      component,
      hospital: hospital.trim(),
      area: area.trim(),
      contactName: contactName.trim(),
      contactPhone: normalizeIndianPhone(contactPhone),
      urgency,
      notes: notes.trim(),
      rarePhenotypeNeeded: rarePhenotypeNeeded || null,
      status: "open",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + hours * 3600_000).toISOString(),
    });
    clearDraft();
    router.push(`/requests/${id}`);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Request blood"
        subtitle="Takes under a minute. The moment you post, we'll show every compatible donor you can call — no waiting on forwards."
      />
      {patientPrefill && (
        <p role="status" className="mb-4 rounded-xl bg-purple-50 px-4 py-3 text-sm font-medium text-purple-900 ring-1 ring-inset ring-purple-200">
          Pre-filled from {patientPrefill}'s profile — adjust the units and post.
        </p>
      )}
      {draftRestored && (
        <p role="status" className="mb-4 flex items-center justify-between gap-3 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 ring-1 ring-inset ring-amber-200">
          <span>Your unfinished draft was restored — nothing was lost.</span>
          <button
            type="button"
            onClick={clearDraft}
            className="min-h-[44px] shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-amber-100"
          >
            Discard
          </button>
        </p>
      )}
      <form onSubmit={submit} className="space-y-5 rounded-2xl border border-ink-200 bg-white p-5 sm:p-8">
        {error && (
          <p role="alert" className="rounded-xl bg-crimson-50 px-4 py-3 text-sm font-medium text-crimson-800 ring-1 ring-inset ring-crimson-200">
            {error}
          </p>
        )}
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Patient name">
            <input className={inputCls} value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="e.g. R. Selvam" />
          </Field>
          <Field label="Blood group needed">
            <select className={inputCls} value={group} onChange={(e) => setGroup(e.target.value as BloodGroup)}>
              {BLOOD_GROUPS.map((g) => (
                <option key={g} value={g}>{g}{isRare(g) ? " — rare" : ""}</option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Units needed" hint="Whole-blood units (1 unit ≈ 350 ml).">
            <input type="number" min={1} max={10} className={inputCls} value={units} onChange={(e) => setUnits(Number(e.target.value))} />
          </Field>
          <Field label="Blood component" hint="What the hospital asked for. Platelets last ~5 days, so platelet requests are always time-critical.">
            <select className={inputCls} value={component} onChange={(e) => setComponent(e.target.value as BloodComponent)}>
              <option value="whole">Whole blood</option>
              <option value="plasma">Plasma</option>
              <option value="platelets">Platelets</option>
            </select>
          </Field>
          <Field label="Urgency" hint="Sets how long the request stays open.">
            <select className={inputCls} value={urgency} onChange={(e) => setUrgency(e.target.value as typeof urgency)}>
              {URGENCIES.map((u) => (
                <option key={u.value} value={u.value}>{u.label}</option>
              ))}
            </select>
          </Field>
          {isComponentUrgent(component) && urgency !== "critical" && (
            <p role="note" className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 ring-1 ring-inset ring-amber-200">
              Platelets last ~5 days — they can't be stocked. Consider switching urgency to Critical so this stays visible longest.
            </p>
          )}
          <Field label="Rare phenotype needed (optional)" hint="Only when the hospital told you — e.g. Bombay (Oh). Matches get spotlighted.">
            <select className={inputCls} value={rarePhenotypeNeeded} onChange={(e) => setRarePhenotypeNeeded(e.target.value)}>
              <option value="">Not known / not needed</option>
              {RARE_PHENOTYPES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Hospital">
            <input className={inputCls} value={hospital} onChange={(e) => setHospital(e.target.value)} placeholder="e.g. Govt. Hospital, Sriperumbudur" />
          </Field>
          <Field label="Area / locality">
            <input className={inputCls} value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. Sriperumbudur" />
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Contact person">
            <input className={inputCls} value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="e.g. Kavitha (daughter)" />
          </Field>
          <Field label="Contact phone" hint="Donors will call this number.">
            <input className={inputCls} value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+91 …" inputMode="tel" />
          </Field>
        </div>
        <Field label="Notes for donors (optional)" hint="Surgery timing, where to report, anything that helps.">
          <textarea className={`${inputCls} min-h-[88px] resize-y`} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Surgery at 6 AM. Report to the blood bank counter on the ground floor." />
        </Field>
        <button type="submit" className="w-full rounded-xl bg-crimson-600 px-6 py-3.5 text-sm font-semibold text-white hover:bg-crimson-700">
          Post request & find donors
        </button>
      </form>
    </div>
  );
}
