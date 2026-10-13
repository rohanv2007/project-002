"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useDonations, usePledges, useReminders, useDeferrals, useAppointments, readMyName, writeMyName, uid } from "@/lib/store";
import { DONATION_INTERVAL_DAYS, activeDeferralFor, daysSince, formatDate, JOURNEY_STAGES } from "@/lib/blood";
import { MILESTONE_TIERS, buildBadgeShareText, donationStreak } from "@/lib/badges";
import { buildInviteText, whatsappHref } from "@/lib/share";
import { EmptyState, PageHeader } from "@/components/ui";
import type { Appointment, DonationRecord, DonationVitals, Pledge, Reminder } from "@/lib/types";
import { HEMOGLOBIN_CUTOFF_GDL } from "@/lib/types";

/** Downloadable .ics for a booked donation slot — timed from the slot when parseable, all-day otherwise. */
function apptIcsHref(a: Appointment): string {
  const date = a.date.replace(/-/g, "");
  const m = a.slot.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)\s*[–-]\s*(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
  const pad = (n: number) => String(n).padStart(2, "0");
  const to24 = (h: number, ap: string) => (ap === "PM" && h < 12 ? h + 12 : ap === "AM" && h === 12 ? 0 : h);
  let dtstart = `DTSTART;VALUE=DATE:${date}`;
  let dtend = `DTEND;VALUE=DATE:${date}`;
  if (m) {
    dtstart = `DTSTART:${date}T${pad(to24(+m[1], m[3]))}${m[2]}00`;
    dtend = `DTEND:${date}T${pad(to24(+m[4], m[6]))}${m[5]}00`;
  }
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Raktha//Donation Appointment//EN",
    "BEGIN:VEVENT",
    `UID:${a.id}@raktha`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
    dtstart,
    dtend,
    `SUMMARY:${esc("Blood donation appointment — Raktha")}`,
    `DESCRIPTION:${esc(`${a.label} · Slot: ${a.slot}`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(lines.join("\r\n"))}`;
}

/** Mini-physical panel on each logged donation: view or record the quick
 *  health check every camp runs (hemoglobin, BP, pulse, weight) — the same
 *  vitals the American Red Cross app surfaces in its donor card. A low
 *  hemoglobin reading flags the 12.5 g/dL donation cutoff so donors can
 *  work on it before their next visit. */
function DonationVitalsPanel({
  donation,
  onSave,
}: {
  donation: DonationRecord;
  onSave: (v: DonationVitals) => void;
}) {
  const [open, setOpen] = useState(false);
  const [hb, setHb] = useState(donation.vitals?.hemoglobin?.toString() ?? "");
  const [sys, setSys] = useState(donation.vitals?.systolic?.toString() ?? "");
  const [dia, setDia] = useState(donation.vitals?.diastolic?.toString() ?? "");
  const [pulse, setPulse] = useState(donation.vitals?.pulse?.toString() ?? "");
  const [weight, setWeight] = useState(donation.vitals?.weight?.toString() ?? "");
  const [error, setError] = useState("");

  const v = donation.vitals;
  const hasVitals =
    v != null &&
    (v.hemoglobin != null || v.systolic != null || v.pulse != null || v.weight != null);
  const lowHb = v?.hemoglobin != null && v.hemoglobin < HEMOGLOBIN_CUTOFF_GDL;

  const parseNum = (s: string): number | undefined => {
    const t = s.trim();
    if (!t) return undefined;
    const n = Number(t);
    return Number.isFinite(n) && n > 0 ? n : NaN;
  };

  const save = () => {
    const hbN = parseNum(hb);
    const sysN = parseNum(sys);
    const diaN = parseNum(dia);
    const pulseN = parseNum(pulse);
    const wtN = parseNum(weight);
    if ([hbN, sysN, diaN, pulseN, wtN].some((n) => Number.isNaN(n))) {
      setError("Vitals must be positive numbers.");
      return;
    }
    if (sysN !== undefined && diaN !== undefined && sysN <= diaN) {
      setError("Systolic (top number) should be higher than diastolic.");
      return;
    }
    setError("");
    onSave({ hemoglobin: hbN, systolic: sysN, diastolic: diaN, pulse: pulseN, weight: wtN });
    setOpen(false);
  };

  const inputCls =
    "w-full rounded-[3px] border border-line bg-cream px-3 py-2 text-sm text-ink min-h-[44px]";

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-soot">Mini-physical</p>
        <button
          onClick={() => {
            setOpen(!open);
            setError("");
          }}
          className="rounded-[3px] px-3 py-1.5 text-xs font-semibold text-signal hover:bg-cream min-h-[44px]"
          aria-expanded={open}
        >
          {hasVitals ? "Edit vitals" : "Log vitals"}
        </button>
      </div>
      {hasVitals && !open && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {v!.hemoglobin != null && (
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold tnum ${
                lowHb ? "bg-cream text-gold" : "bg-sand text-ink"
              }`}
            >
              Hb {v!.hemoglobin} g/dL
            </span>
          )}
          {v!.systolic != null && v!.diastolic != null && (
            <span className="rounded-full bg-sand px-2.5 py-1 text-xs font-semibold text-ink tnum">
              BP {v!.systolic}/{v!.diastolic}
            </span>
          )}
          {v!.pulse != null && (
            <span className="rounded-full bg-sand px-2.5 py-1 text-xs font-semibold text-ink tnum">
              Pulse {v!.pulse} bpm
            </span>
          )}
          {v!.weight != null && (
            <span className="rounded-full bg-sand px-2.5 py-1 text-xs font-semibold text-ink tnum">
              {v!.weight} kg
            </span>
          )}
        </div>
      )}
      {lowHb && !open && (
        <p className="mt-2 rounded-[3px] bg-cream px-3 py-2 text-xs font-medium text-gold ring-1 ring-inset ring-line">
          Hemoglobin below the {HEMOGLOBIN_CUTOFF_GDL} g/dL donation cutoff — this is the most
          common deferral reason. Iron-rich food and a recheck in a few weeks usually fix it.{" "}
          <Link href="/learn" className="font-bold underline">
            What to know
          </Link>
        </p>
      )}
      {!hasVitals && !open && (
        <p className="mt-1 text-xs text-faint">
          Camps check BP, pulse and hemoglobin before every donation — save yours here and spot
          trends.
        </p>
      )}
      {open && (
        <div className="mt-2 rounded-[3px] bg-paper p-3">
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-xs font-semibold text-soot">Hemoglobin (g/dL)</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                value={hb}
                onChange={(e) => setHb(e.target.value)}
                placeholder="13.2"
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-soot">Weight (kg)</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="64"
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-soot">BP systolic</span>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                value={sys}
                onChange={(e) => setSys(e.target.value)}
                placeholder="120"
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-soot">BP diastolic</span>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                value={dia}
                onChange={(e) => setDia(e.target.value)}
                placeholder="80"
                className={inputCls}
              />
            </label>
            <label className="block col-span-2">
              <span className="text-xs font-semibold text-soot">Pulse (bpm)</span>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                value={pulse}
                onChange={(e) => setPulse(e.target.value)}
                placeholder="72"
                className={inputCls}
              />
            </label>
          </div>
          {error && <p className="mt-2 text-xs font-semibold text-signal">{error}</p>}
          <div className="mt-2 flex gap-2">
            <button
              onClick={save}
              className="rounded-[3px] bg-signal px-4 py-2 text-xs font-bold text-cream hover:bg-ember min-h-[44px]"
            >
              Save vitals
            </button>
            <button
              onClick={() => setOpen(false)}
              className="rounded-[3px] border border-line px-4 py-2 text-xs font-semibold text-soot hover:bg-cream min-h-[44px]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MyDonations() {
  const [donations, , addDonation, updateDonation, removeDonation] = useDonations();
  const [reminders, , addReminder, updateReminder, removeReminder] = useReminders();
  const [pledges, , addPledge, updatePledge, removePledge] = usePledges();
  const [deferrals, , , , removeDeferral] = useDeferrals();
  const [appointments, , , , removeAppointment] = useAppointments();
  const [date, setDate] = useState("");
  const [units, setUnits] = useState(1);
  const [location, setLocation] = useState("");
  const [pledgeDate, setPledgeDate] = useState("");
  const [pledgeLocation, setPledgeLocation] = useState("");
  const [myName, setMyName] = useState("");
  const [inviteCopied, setInviteCopied] = useState(false);

  const inviteText = buildInviteText(myName, "");
  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteText);
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2500);
    } catch {
      // clipboard unavailable — WhatsApp share still works
    }
  };

  useEffect(() => {
    setMyName(readMyName());
  }, []);

  const sorted = useMemo(
    () => [...donations].sort((a, b) => b.date.localeCompare(a.date)),
    [donations]
  );
  const totalUnits = donations.reduce((s, d) => s + d.units, 0);
  const last = sorted[0];
  const sinceLast = last ? daysSince(last.date) : null;
  // Researched insight #4 (Penn State / Red Cross studies): donors who learn
  // where their blood was used are ~10% more likely to donate again. One
  // whole-blood donation can help up to three patients — surface that impact.
  const livesTouched = totalUnits * 3;
  const streak = donationStreak(donations.map((d) => d.date));
  const myDeferral = activeDeferralFor(deferrals, null);
  const upcomingAppts = appointments
    .filter((a) => a.date >= new Date().toISOString().slice(0, 10))
    .sort((a, b) => a.date.localeCompare(b.date));

  const attendAppointment = (a: (typeof upcomingAppts)[number]) => {
    addDonation({
      id: uid("don"),
      donorId: null,
      date: a.date,
      units: 1,
      location: a.label,
      journey: 0,
    });
    removeAppointment(a.id);
  };
  const completedJourneys = sorted.filter(
    (d) => (d.journey ?? 0) >= JOURNEY_STAGES.length - 1
  );
  const nextDate = last ? (() => { const d = new Date(last.date + "T00:00:00"); d.setDate(d.getDate() + DONATION_INTERVAL_DAYS); return d; })() : null;
  const canDonate = sinceLast === null || sinceLast >= DONATION_INTERVAL_DAYS;

  // ---- Personalised donation journey (iDonate-style): the best time to
  // re-donate, derived from YOUR interval, plus a nudge when it arrives.
  const todayIso = new Date().toISOString().slice(0, 10);
  const nextIso = nextDate ? nextDate.toISOString().slice(0, 10) : null;
  const windowEnd = nextDate ? (() => { const d = new Date(nextDate); d.setDate(d.getDate() + 14); return d; })() : null;

  const dueReminders = useMemo(
    () =>
      reminders.filter(
        (r) =>
          r.forDate <= todayIso &&
          (!r.snoozedUntil || r.snoozedUntil <= todayIso)
      ),
    [reminders, todayIso]
  );
  const upcomingReminders = useMemo(
    () =>
      reminders
        .filter((r) => r.forDate > todayIso || (r.snoozedUntil && r.snoozedUntil > todayIso))
        .sort((a, b) => (a.snoozedUntil ?? a.forDate).localeCompare(b.snoozedUntil ?? b.forDate)),
    [reminders, todayIso]
  );
  const hasReminderForNext = nextIso ? reminders.some((r) => r.forDate === nextIso) : false;

  // ---- Commit-to-give pledges (researched insight #3): donors who schedule
  // their next donation are far more likely to actually return.
  const minPledgeDate = canDonate ? todayIso : (nextIso ?? todayIso);
  const duePledges = useMemo(
    () => pledges.filter((p) => p.forDate <= todayIso).sort((a, b) => a.forDate.localeCompare(b.forDate)),
    [pledges, todayIso]
  );
  const upcomingPledges = useMemo(
    () => pledges.filter((p) => p.forDate > todayIso).sort((a, b) => a.forDate.localeCompare(b.forDate)),
    [pledges, todayIso]
  );

  const makePledge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pledgeDate || pledgeDate < minPledgeDate) return;
    addPledge({
      id: uid("plg"),
      forDate: pledgeDate,
      location: pledgeLocation.trim(),
      createdAt: new Date().toISOString(),
    });
    setPledgeDate("");
    setPledgeLocation("");
  };
  const snoozePledge = (p: Pledge) => {
    const d = new Date(p.forDate + "T00:00:00");
    d.setDate(d.getDate() + 7);
    updatePledge(p.id, { forDate: d.toISOString().slice(0, 10) });
  };
  const fulfillPledge = (p: Pledge) => {
    addDonation({
      id: uid("myd"),
      donorId: null,
      date: new Date().toISOString().slice(0, 10),
      units: 1,
      location: p.location || "—",
      journey: 0,
    });
    removePledge(p.id);
  };

  const setEligibilityReminder = () => {
    if (!nextIso || hasReminderForNext) return;
    addReminder({
      id: uid("rem"),
      kind: "eligibility",
      forDate: nextIso,
      note: "Eligible to donate again — your 90-day interval is complete.",
      createdAt: new Date().toISOString(),
      snoozedUntil: null,
    });
  };
  const snoozeReminder = (r: Reminder) => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    updateReminder(r.id, { snoozedUntil: d.toISOString().slice(0, 10) });
  };

  const log = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;
    addDonation({ id: uid("myd"), donorId: null, date, units: Math.max(1, units), location: location.trim() || "—", journey: 0 });
    setDate(""); setUnits(1); setLocation("");
  };

  const downloadCsv = () => {
    const rows: string[][] = [["Date", "Units", "Location", "Journey", "Hb (g/dL)", "BP", "Pulse (bpm)", "Weight (kg)"]];
    sorted.forEach((d) =>
      rows.push([
        d.date,
        String(d.units),
        d.location,
        JOURNEY_STAGES[Math.min(d.journey ?? 0, JOURNEY_STAGES.length - 1)],
        d.vitals?.hemoglobin != null ? String(d.vitals.hemoglobin) : "",
        d.vitals?.systolic != null && d.vitals?.diastolic != null
          ? `${d.vitals.systolic}/${d.vitals.diastolic}`
          : "",
        d.vitals?.pulse != null ? String(d.vitals.pulse) : "",
        d.vitals?.weight != null ? String(d.vitals.weight) : "",
      ])
    );
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "raktha-donation-history.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="My donations"
        subtitle="Your personal log. Watch the milestones stack up — and never guess your next eligible date again."
      />

      {dueReminders.length > 0 && (
        <section
          role="alert"
          aria-label="Donation reminders"
          className="rounded-[4px] border-2 border-moss bg-cream p-5"
        >
          <h2 className="text-base font-bold text-moss">
            You're eligible to donate again
          </h2>
          <p className="mt-1 text-sm text-moss">
            {dueReminders[0].note} One donation can help up to three patients.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/banks"
              className="rounded-[3px] bg-moss px-4 py-2 text-sm font-semibold text-cream hover:bg-moss min-h-[44px] inline-flex items-center"
            >
              Find a blood bank
            </Link>
            <button
              onClick={() => snoozeReminder(dueReminders[0])}
              className="rounded-[3px] border border-moss px-4 py-2 text-sm font-semibold text-moss hover:bg-cream min-h-[44px]"
            >
              Snooze 3 days
            </button>
            <button
              onClick={() => removeReminder(dueReminders[0].id)}
              className="rounded-[3px] px-4 py-2 text-sm font-semibold text-moss underline-offset-2 hover:underline min-h-[44px]"
            >
              Dismiss
            </button>
          </div>
        </section>
      )}

      {duePledges.length > 0 && (
        <section
          role="alert"
          aria-label="Donation pledge due"
          className="rounded-[4px] border-2 border-signal bg-cream p-5"
        >
          <h2 className="text-base font-bold text-ember">
            You pledged to donate {duePledges[0].forDate < todayIso ? "on " + formatDate(duePledges[0].forDate) : "today"}
          </h2>
          <p className="mt-1 text-sm text-ember">
            {duePledges[0].location ? `At ${duePledges[0].location}. ` : ""}Donors who keep their pledged
            date are far more likely to come back again — this is how regular donors are made.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => fulfillPledge(duePledges[0])}
              className="rounded-[3px] bg-signal px-4 py-2 text-sm font-semibold text-cream hover:bg-ember min-h-[44px]"
            >
              I donated today — log it
            </button>
            <button
              onClick={() => snoozePledge(duePledges[0])}
              className="rounded-[3px] border border-signal px-4 py-2 text-sm font-semibold text-ember hover:bg-cream min-h-[44px]"
            >
              Push by 7 days
            </button>
            <button
              onClick={() => removePledge(duePledges[0].id)}
              className="rounded-[3px] px-4 py-2 text-sm font-semibold text-ember underline-offset-2 hover:underline min-h-[44px]"
            >
              Cancel pledge
            </button>
          </div>
        </section>
      )}

      {streak >= 2 && (
        <section
          role="status"
          aria-label="Donation streak"
          className="rounded-[4px] border border-line bg-cream p-5"
        >
          <h2 className="text-base font-bold text-gold">
            {streak}-window donation streak
          </h2>
          <p className="mt-1 text-sm text-gold">
            You've donated in {streak} consecutive 90-day windows. Regular donors like you are
            the backbone of every blood service — this is how shortages get solved.
          </p>
        </section>
      )}

      {myDeferral && (
        <section
          role="alert"
          aria-label="Active blood-bank deferral"
          className="rounded-[4px] border border-line bg-cream p-5"
        >
          <h2 className="text-base font-bold text-gold">
            You're on a deferral until {formatDate(myDeferral.deferredUntil)}
          </h2>
          <p className="mt-1 text-sm text-gold">
            {myDeferral.reason} You won't appear as a ready donor in emergency matches
            until this lifts — that's the safe, honest behaviour.
          </p>
          <button
            onClick={() => removeDeferral(myDeferral.id)}
            className="mt-3 rounded-[3px] border border-gold px-4 py-2 text-sm font-semibold text-gold hover:bg-cream min-h-[44px]"
          >
            Cleared early — remove it
          </button>
        </section>
      )}

      {upcomingAppts.length > 0 && (
        <section aria-label="Donation appointments" className="rounded-[4px] border border-line bg-cream p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-ink">Your donation appointments</h2>
            <Link href="/camps" className="text-xs font-semibold text-signal hover:underline">
              Book another
            </Link>
          </div>
          <ul className="mt-3 space-y-2">
            {upcomingAppts.map((a) => {
              const todayStart = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00").getTime();
              const daysOut = Math.round((new Date(a.date + "T00:00:00").getTime() - todayStart) / 86400000);
              return (
                <li key={a.id} className="flex flex-wrap items-center gap-3 rounded-[3px] bg-paper px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{a.label}</p>
                    <p className="text-xs text-faint">
                      {formatDate(a.date)} · {a.slot}
                      {daysOut <= 1 && <span className="font-bold text-signal"> — {daysOut === 0 ? "today" : "tomorrow"}, don't skip</span>}
                      {daysOut > 1 && <span> · in {daysOut} days</span>}
                    </p>
                  </div>
                  <button
                    onClick={() => attendAppointment(a)}
                    className="rounded-[3px] bg-moss px-3 py-2 text-xs font-semibold text-cream hover:bg-moss min-h-[44px]"
                  >
                    I donated — log it
                  </button>
                  <a
                    href={apptIcsHref(a)}
                    download={`raktha-appointment-${a.date}.ics`}
                    className="rounded-[3px] px-3 py-2 text-xs font-semibold text-soot hover:bg-sand min-h-[44px] inline-flex items-center"
                  >
                    Add to calendar
                  </a>
                  <button
                    onClick={() => removeAppointment(a.id)}
                    className="rounded-[3px] px-3 py-2 text-xs font-semibold text-faint hover:bg-sand min-h-[44px]"
                  >
                    Cancel
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section aria-label="Invite a donor" className="rounded-[4px] border border-line bg-cream p-5">
        <h2 className="text-sm font-bold text-ink">Know someone who should donate?</h2>
        <p className="mt-1 text-sm text-soot">
          A personal invite from a donor converts better than any poster. Send this to
          friends and family — every new registrant makes the next emergency easier.
        </p>
        <p className="mt-3 whitespace-pre-line rounded-[3px] bg-paper px-4 py-3 text-sm text-soot">
          {inviteText}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={whatsappHref(inviteText)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-[3px] bg-moss px-5 py-2.5 text-sm font-semibold text-cream hover:bg-moss min-h-[44px] inline-flex items-center"
          >
            Share on WhatsApp
          </a>
          <button
            onClick={copyInvite}
            className="rounded-[3px] border border-line px-5 py-2.5 text-sm font-semibold text-ink hover:bg-paper min-h-[44px]"
          >
            {inviteCopied ? "Copied ✓" : "Copy text"}
          </button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <div className="rounded-[4px] border border-line bg-cream p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-faint">Lifetime donations</p>
          <p className="tnum mt-1 text-3xl font-bold text-ink">{donations.length}</p>
          <p className="tnum mt-1 text-xs text-faint">{totalUnits} unit{totalUnits === 1 ? "" : "s"} given</p>
        </div>
        <div className="rounded-[4px] border border-line bg-cream p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-faint">Lives touched</p>
          <p className="tnum mt-1 text-3xl font-bold text-signal">{livesTouched}</p>
          <p className="mt-1 text-xs text-faint">≈ 3 per donation</p>
        </div>
        <div className={`rounded-[4px] border p-5 ${canDonate ? "border-moss bg-cream" : "border-line bg-cream"}`}>
          <p className="text-xs font-semibold uppercase tracking-widest text-faint">Status</p>
          {canDonate ? (
            <p className="mt-1 text-lg font-bold text-moss">Eligible now</p>
          ) : (
            <>
              <p className="tnum mt-1 text-lg font-bold text-ink">{DONATION_INTERVAL_DAYS - (sinceLast ?? 0)} days to go</p>
              <p className="mt-1 text-xs text-faint">Eligible {nextDate ? formatDate(nextDate.toISOString().slice(0, 10)) : ""}</p>
            </>
          )}
        </div>
      </section>

      <section aria-label="Pledge your next donation" className="rounded-[4px] border border-line bg-cream p-5">
        <h2 className="text-sm font-bold text-ink">Pledge your next donation</h2>
        <p className="mt-1 text-sm text-soot">
          Pick a date and commit. Donors who schedule their next visit are far more likely
          to return — a pledge turns "someday" into a plan.
        </p>
        <form onSubmit={makePledge} className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <input
            type="date"
            required
            value={pledgeDate}
            min={minPledgeDate}
            onChange={(e) => setPledgeDate(e.target.value)}
            aria-label="Pledge date"
            className="rounded-[3px] border border-line px-3 py-2.5 text-sm min-h-[44px]"
          />
          <input
            value={pledgeLocation}
            onChange={(e) => setPledgeLocation(e.target.value)}
            placeholder="Where? e.g. IMA Blood Centre"
            aria-label="Pledge location"
            className="rounded-[3px] border border-line px-3 py-2.5 text-sm min-h-[44px]"
          />
          <button type="submit" className="rounded-[3px] bg-ink px-5 py-2.5 text-sm font-semibold text-cream hover:bg-ink min-h-[44px]">
            Pledge
          </button>
        </form>
        {!canDonate && nextIso && (
          <p className="mt-2 text-xs text-faint">
            Earliest pledge date is {formatDate(nextIso)} — when your 90-day interval completes.
          </p>
        )}
        {upcomingPledges.length > 0 && (
          <ul className="mt-4 space-y-2">
            {upcomingPledges.map((p) => (
              <li key={p.id} className="flex items-center gap-3 rounded-[3px] bg-paper px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">Pledged for {formatDate(p.forDate)}</p>
                  {p.location && <p className="truncate text-xs text-faint">{p.location}</p>}
                </div>
                <button
                  onClick={() => removePledge(p.id)}
                  className="rounded-[3px] px-3 py-1.5 text-xs font-semibold text-faint hover:bg-cream hover:text-signal min-h-[44px]"
                >
                  Cancel
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="Your donation journey" className="rounded-[4px] border border-line bg-cream p-5">
        <h2 className="text-sm font-bold text-ink">Your donation journey</h2>
        {nextDate ? (
          <>
            <p className="tnum mt-2 text-sm text-soot">
              {canDonate ? (
                <>You're eligible now — every day you wait is a day blood banks go without your group.</>
              ) : (
                <>Eligible again <strong>{formatDate(nextIso!)}</strong> — {DONATION_INTERVAL_DAYS - (sinceLast ?? 0)} days to go.</>
              )}
            </p>
            {!canDonate && windowEnd && (
              <p className="mt-1 text-sm text-soot">
                Best window to book:{" "}
                <strong className="text-ink">
                  {formatDate(nextIso!)} – {formatDate(windowEnd.toISOString().slice(0, 10))}
                </strong>
                . Donating in the first two weeks after eligibility keeps bank stock fresh when it's needed most.
              </p>
            )}
            {!canDonate && (
              hasReminderForNext ? (
                <p className="mt-3 rounded-[3px] bg-cream px-4 py-2.5 text-sm font-medium text-moss ring-1 ring-inset ring-line">
                  ✓ Reminder set — we'll nudge you on {formatDate(nextIso!)}.
                </p>
              ) : (
                <button
                  onClick={setEligibilityReminder}
                  className="mt-3 rounded-[3px] border border-signal bg-cream px-4 py-2.5 text-sm font-semibold text-signal hover:bg-cream min-h-[44px]"
                >
                  Remind me when I'm eligible
                </button>
              )
            )}
          </>
        ) : (
          <p className="mt-2 text-sm text-soot">
            No donations logged yet — log your first one above and we'll track your personal
            90-day rhythm from here, with a nudge the day you're eligible again.
          </p>
        )}
        {upcomingReminders.length > 0 && (
          <div className="mt-4 border-t border-line pt-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-faint">Reminder queue</h3>
            <ul className="mt-2 space-y-2">
              {upcomingReminders.map((r) => (
                <li key={r.id} className="flex items-center gap-3 rounded-[3px] bg-paper px-4 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{r.note}</p>
                    <p className="tnum text-xs text-faint">
                      {r.snoozedUntil && r.snoozedUntil > todayIso
                        ? `Snoozed until ${formatDate(r.snoozedUntil)}`
                        : `Due ${formatDate(r.forDate)}`}
                    </p>
                  </div>
                  <button
                    onClick={() => snoozeReminder(r)}
                    className="rounded-[3px] border border-line px-3 py-1.5 text-xs font-semibold text-soot hover:bg-cream min-h-[44px]"
                  >
                    Snooze
                  </button>
                  <button
                    onClick={() => removeReminder(r.id)}
                    className="rounded-[3px] px-3 py-1.5 text-xs font-semibold text-faint hover:bg-cream hover:text-signal min-h-[44px]"
                  >
                    Cancel
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section aria-label="Your blood's impact" className="rounded-[4px] border border-line bg-cream p-5">
        <h2 className="text-sm font-bold text-ink">Your blood's impact</h2>
        {sorted.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-[3px] bg-cream px-2 py-3 ring-1 ring-inset ring-line">
              <p className="tnum text-xl font-extrabold text-signal">{sorted.length}</p>
              <p className="text-[11px] font-medium text-soot">donations</p>
            </div>
            <div className="rounded-[3px] bg-cream px-2 py-3 ring-1 ring-inset ring-line">
              <p className="tnum text-xl font-extrabold text-signal">{totalUnits}</p>
              <p className="text-[11px] font-medium text-soot">units given</p>
            </div>
            <div className="rounded-[3px] bg-cream px-2 py-3 ring-1 ring-inset ring-line">
              <p className="tnum text-xl font-extrabold text-signal">{totalUnits * 3}</p>
              <p className="text-[11px] font-medium text-soot">lives you could touch*</p>
            </div>
          </div>
        )}
        {sorted.length > 0 && (
          <p className="mt-2 text-[11px] text-faint">
            *One unit can be separated into red cells, plasma and platelets — up to three lives per unit (American Red Cross).
          </p>
        )}
        {completedJourneys.length === 0 ? (
          <p className="mt-2 text-sm text-soot">
            When a logged donation completes its journey, its impact report lands here —
            knowing exactly where your blood went is the nudge that brings donors back.
          </p>
        ) : (
          <>
            <ul className="mt-3 space-y-2">
              {completedJourneys.map((d) => (
                <li key={d.id} className="rounded-[3px] bg-cream px-4 py-3 ring-1 ring-inset ring-line">
                  <p className="text-sm font-semibold text-moss">
                    Your {formatDate(d.date)} donation ({d.units} unit{d.units === 1 ? "" : "s"}) reached a patient.
                  </p>
                  <p className="mt-0.5 text-xs text-moss">
                    Donated at {d.location} · up to {d.units * 3} lives touched. Thank you —
                    this is what the whole network is for.
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-faint">
              Tip: a week after donating, call {completedJourneys[0].location} and ask which
              hospital received your unit — donors who hear that answer donate again sooner.
            </p>
          </>
        )}
      </section>

      <section className="rounded-[4px] border border-line bg-cream p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-ink">Milestones</h2>
          <label className="flex items-center gap-2 text-xs font-medium text-soot">
            Certificate name
            <input
              value={myName}
              onChange={(e) => { setMyName(e.target.value); writeMyName(e.target.value); }}
              placeholder="e.g. Arun Kumar"
              aria-label="Your name as it should appear on certificates"
              className="w-40 rounded-[3px] border border-line px-2.5 py-1.5 text-sm min-h-[44px]"
            />
          </label>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {MILESTONE_TIERS.map((m) => {
            const earned = donations.length >= m.n;
            return (
              <div key={m.n} className={`rounded-[3px] border p-3 text-center ${earned ? "border-signal bg-cream" : "border-line bg-paper opacity-60"}`}>
                <p className={`tnum text-2xl font-bold ${earned ? "text-signal" : "text-faint"}`}>{m.n}</p>
                <p className="text-xs font-bold text-ink">{m.label}</p>
                <p className="mt-1 text-[11px] leading-snug text-faint">{earned ? m.desc : `${m.n - donations.length} to go`}</p>
                {earned && (
                  <div className="mt-2 flex flex-col gap-1.5">
                    <Link
                      href={`/me/certificate?n=${m.n}`}
                      className="inline-flex min-h-[44px] items-center justify-center rounded-[3px] bg-cream px-3 py-1 text-[11px] font-bold text-ink ring-1 ring-inset ring-line hover:bg-paper"
                    >
                      Print certificate
                    </Link>
                    <a
                      href={whatsappHref(buildBadgeShareText(m, donations.length))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[44px] items-center justify-center rounded-[3px] bg-cream px-3 py-1 text-[11px] font-bold text-signal ring-1 ring-inset ring-signal hover:bg-cream"
                    >
                      Share badge
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-[4px] border border-line bg-cream p-5">
        <h2 className="text-sm font-bold text-ink">Log a donation</h2>
        <form onSubmit={log} className="mt-3 grid gap-3 sm:grid-cols-[1fr_100px_1fr_auto]">
          <input type="date" required value={date} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} aria-label="Donation date" className="rounded-[3px] border border-line px-3 py-2.5 text-sm min-h-[44px]" />
          <input type="number" min={1} max={4} value={units} onChange={(e) => setUnits(Number(e.target.value))} aria-label="Units" className="rounded-[3px] border border-line px-3 py-2.5 text-sm min-h-[44px]" />
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Where? e.g. Saveetha Blood Centre" aria-label="Donation location" className="rounded-[3px] border border-line px-3 py-2.5 text-sm min-h-[44px]" />
          <button type="submit" className="rounded-[3px] bg-signal px-5 py-2.5 text-sm font-semibold text-cream hover:bg-ember min-h-[44px]">Log</button>
        </form>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-ink">History</h2>
          {sorted.length > 0 && (
            <div className="flex gap-2 print:hidden">
              <button
                onClick={downloadCsv}
                className="rounded-[3px] border border-line px-3.5 py-1.5 text-xs font-semibold text-ink hover:bg-paper min-h-[44px]"
              >
                Download CSV
              </button>
              <button
                onClick={() => window.print()}
                className="rounded-[3px] border border-line px-3.5 py-1.5 text-xs font-semibold text-ink hover:bg-paper min-h-[44px]"
              >
                Print record
              </button>
            </div>
          )}
        </div>
        <div className="mb-4 hidden print:block">
          <p className="text-lg font-bold text-ink">Raktha — My donation record</p>
          <p className="text-xs text-soot">
            {sorted.length} donation{sorted.length === 1 ? "" : "s"} · {totalUnits} unit{totalUnits === 1 ? "" : "s"} given · printed {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        {sorted.length === 0 ? (
          <EmptyState title="No donations logged yet" body="Log your first donation above — or take the eligibility check and make it happen for real." />
        ) : (
          <ul className="space-y-2">
            {sorted.map((d) => {
              const stage = Math.min(d.journey ?? 0, JOURNEY_STAGES.length - 1);
              return (
                <li key={d.id} className="rounded-[3px] border border-line bg-cream px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[3px] bg-cream text-sm font-bold text-signal tnum" aria-hidden="true">
                      {d.units}u
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink">{formatDate(d.date)}</p>
                      <p className="truncate text-xs text-faint">{d.location}</p>
                    </div>
                    <button onClick={() => removeDonation(d.id)} className="rounded-[3px] px-3 py-1.5 text-xs font-semibold text-faint hover:bg-cream hover:text-signal min-h-[44px]">
                      Remove
                    </button>
                  </div>
                  <div className="mt-3 border-t border-line pt-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-soot" aria-live="polite">
                        Journey: {JOURNEY_STAGES[stage]}
                        {stage === JOURNEY_STAGES.length - 1 && (
                          <span className="ml-1 text-signal">— a life touched.</span>
                        )}
                      </p>
                      {stage < JOURNEY_STAGES.length - 1 && (
                        <button
                          onClick={() => updateDonation(d.id, { journey: stage + 1 })}
                          className="shrink-0 rounded-[3px] border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:bg-paper min-h-[44px]"
                        >
                          Next: {JOURNEY_STAGES[stage + 1]}
                        </button>
                      )}
                    </div>
                    <div className="mt-2 flex gap-1.5" role="img" aria-label={`Journey stage ${stage + 1} of ${JOURNEY_STAGES.length}: ${JOURNEY_STAGES[stage]}`}>
                      {JOURNEY_STAGES.map((s, i) => (
                        <div key={s} className="flex-1">
                          <div className={`h-1.5 rounded-full ${i <= stage ? "bg-signal" : "bg-sand"}`} />
                          <p className={`mt-1 hidden text-[10px] leading-tight sm:block ${i <= stage ? "font-semibold text-ink" : "text-faint"}`}>{s}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 border-t border-line pt-3">
                    <DonationVitalsPanel
                      donation={d}
                      onSave={(vitals) => updateDonation(d.id, { vitals })}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
