"use client";

import { useEffect, useMemo, useState } from "react";
import { useCamps, useAppointments, uid } from "@/lib/store";
import { formatDate } from "@/lib/blood";
import { EmptyState, Field, PageHeader, inputCls } from "@/components/ui";
import type { Appointment, CampEvent } from "@/lib/types";

const RSVP_KEY = "raktha.campRsvps.v1";

/** 12h clock label for slot generation. */
function label12(h: number, m: number): string {
  const ap = h >= 12 ? "PM" : "AM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, "0")} ${ap}`;
}

/**
 * One-hour bookable slots between the camp's advertised start and end.
 * Falls back to a single "any time" slot when the organiser left timings blank.
 */
function slotsFor(camp: CampEvent): string[] {
  const start = parseTimeTo24(camp.startTime);
  const end = parseTimeTo24(camp.endTime);
  if (!start || !end || end.h <= start.h) return ["Any time during the camp"];
  const slots: string[] = [];
  for (let h = start.h; h < end.h && slots.length < 8; h++) {
    slots.push(`${label12(h, 0)} – ${label12(h + 1, 0)}`);
  }
  return slots;
}
/** Parse times like "9:00 AM" / "1:00 PM" into 24h clock; null when unknown ("—"). */
function parseTimeTo24(time: string): { h: number; m: number } | null {
  const m = time.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  const ap = m[3].toUpperCase();
  if (ap === "PM" && h < 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  if (h > 23 || min > 59) return null;
  return { h, m: min };
}

/**
 * Build a downloadable .ics for a camp — timed when the organiser gave
 * timings, all-day otherwise. Donors can drop the camp into their phone
 * calendar in one tap instead of remembering the date.
 */
function icsHref(camp: CampEvent): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = camp.date.replace(/-/g, "");
  const start = parseTimeTo24(camp.startTime);
  const end = parseTimeTo24(camp.endTime);
  let dtstart = `DTSTART;VALUE=DATE:${date}`;
  let dtend = `DTEND;VALUE=DATE:${date}`;
  if (start && end) {
    dtstart = `DTSTART:${date}T${pad(start.h)}${pad(start.m)}00`;
    dtend = `DTEND:${date}T${pad(end.h)}${pad(end.m)}00`;
  }
  const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Raktha//Blood Camp//EN",
    "BEGIN:VEVENT",
    `UID:${camp.id}@raktha`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
    dtstart,
    dtend,
    `SUMMARY:${esc(camp.name)} — blood donation camp`,
    `LOCATION:${esc(`${camp.venue}, ${camp.area}`)}`,
    `DESCRIPTION:${esc(`Organiser: ${camp.organiser}. Contact: ${camp.contactPhone}`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(lines.join("\r\n"))}`;
}

export default function Camps() {
  const [camps, , addCamp, updateCamp] = useCamps();
  const [appointments, , addAppointment, , removeAppointment] = useAppointments();
  const [myRsvps, setMyRsvps] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [bookingCampId, setBookingCampId] = useState<string | null>(null);
  const [chosenSlot, setChosenSlot] = useState("");

  // My RSVPs persist across visits — one tap per camp, toggleable.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RSVP_KEY);
      if (raw) setMyRsvps(JSON.parse(raw) as string[]);
    } catch {
      // ignore
    }
  }, []);

  const toggleRsvp = (c: CampEvent) => {
    const going = myRsvps.includes(c.id);
    const next = going ? myRsvps.filter((id) => id !== c.id) : [...myRsvps, c.id];
    setMyRsvps(next);
    try {
      window.localStorage.setItem(RSVP_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
    updateCamp(c.id, { rsvps: Math.max(0, (c.rsvps ?? 0) + (going ? -1 : 1)) });
  };
  const bookSlot = (c: CampEvent) => {
    if (!chosenSlot) return;
    addAppointment({
      id: uid("appt"),
      kind: "camp",
      refId: c.id,
      label: `${c.name} · ${c.venue}, ${c.area}`,
      date: c.date,
      slot: chosenSlot,
      createdAt: new Date().toISOString(),
    });
    setBookingCampId(null);
    setChosenSlot("");
  };
  const [name, setName] = useState("");
  const [organiser, setOrganiser] = useState("");
  const [venue, setVenue] = useState("");
  const [area, setArea] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [phone, setPhone] = useState("");

  const today = new Date().toISOString().slice(0, 10);
  const { upcoming, past } = useMemo(() => {
    const sorted = [...camps].sort((a, b) => a.date.localeCompare(b.date));
    return {
      upcoming: sorted.filter((c) => c.date >= today),
      past: sorted.filter((c) => c.date < today).reverse(),
    };
  }, [camps, today]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !venue.trim() || !area.trim() || !date || !phone.trim()) return;
    addCamp({
      id: uid("camp"),
      name: name.trim(),
      organiser: organiser.trim() || "—",
      venue: venue.trim(),
      area: area.trim(),
      date,
      startTime: startTime.trim() || "—",
      endTime: endTime.trim() || "—",
      contactPhone: phone.trim(),
      createdAt: new Date().toISOString(),
    });
    setName(""); setOrganiser(""); setVenue(""); setArea("");
    setDate(""); setStartTime(""); setEndTime(""); setPhone("");
    setShowForm(false);
  };

  const campCard = (c: (typeof camps)[number], isPast: boolean) => {
    const myAppt = appointments.find((a) => a.refId === c.id);
    return (
    <article
      key={c.id}
      className={`rounded-[4px] border bg-cream p-5 ${isPast ? "border-line opacity-70" : "border-line"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-[24px] font-semibold tracking-tight text-ink">{c.name}</h2>
          <p className="mt-0.5 text-xs text-faint">
            {c.organiser} · {c.area}
          </p>
        </div>
        <p className={`tnum shrink-0 rounded-[3px] px-3 py-1.5 text-center text-xs font-bold ${
          isPast ? "bg-sand text-faint" : "bg-cream text-ember ring-1 ring-inset ring-signal"
        }`}>
          {formatDate(c.date)}
        </p>
      </div>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-faint">Venue</dt>
          <dd className="mt-0.5 font-medium text-ink">{c.venue}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-faint">Time</dt>
          <dd className="tnum mt-0.5 font-medium text-ink">
            {c.startTime} – {c.endTime}
          </dd>
        </div>
      </dl>
      {!isPast && (
        <>
          {myAppt ? (
            <div className="mt-4 flex flex-wrap items-center gap-2 rounded-[3px] bg-cream p-3 ring-1 ring-inset ring-line">
              <p className="text-sm font-semibold text-moss">
                Booked · {myAppt.slot}
              </p>
              <button
                onClick={() => removeAppointment(myAppt.id)}
                className="rounded-[3px] px-3 py-1.5 text-xs font-semibold text-moss underline-offset-2 hover:underline min-h-[44px]"
              >
                Cancel appointment
              </button>
            </div>
          ) : bookingCampId === c.id ? (
            <div className="mt-4 rounded-[3px] bg-paper p-3">
              <p className="text-xs font-semibold text-soot">Pick a one-hour slot</p>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3" role="group" aria-label={`Donation slots for ${c.name}`}>
                {slotsFor(c).map((s) => (
                  <button
                    key={s}
                    onClick={() => setChosenSlot(s)}
                    aria-pressed={chosenSlot === s}
                    className={`tnum rounded-[3px] border px-3 py-2 text-xs font-semibold min-h-[44px] ${
                      chosenSlot === s
                        ? "border-signal bg-signal text-cream"
                        : "border-line bg-cream text-soot hover:bg-paper"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  onClick={() => bookSlot(c)}
                  disabled={!chosenSlot}
                  className="rounded-[3px] bg-signal px-5 py-2.5 text-sm font-semibold text-cream hover:bg-ember disabled:cursor-not-allowed disabled:bg-line min-h-[44px]"
                >
                  Confirm slot
                </button>
                <button
                  onClick={() => { setBookingCampId(null); setChosenSlot(""); }}
                  className="rounded-[3px] px-4 py-2.5 text-sm font-semibold text-faint hover:bg-sand min-h-[44px]"
                >
                  Back
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={`tel:${c.contactPhone.replace(/[\s-]/g, "")}`}
                className="inline-flex min-h-[44px] items-center rounded-[3px] bg-signal px-5 py-2.5 text-sm font-semibold text-cream hover:bg-ember"
              >
                Call organiser
              </a>
              <button
                onClick={() => toggleRsvp(c)}
                aria-pressed={myRsvps.includes(c.id)}
                className={`inline-flex min-h-[44px] items-center rounded-[3px] border px-5 py-2.5 text-sm font-semibold ${
                  myRsvps.includes(c.id)
                    ? "border-moss bg-cream text-moss"
                    : "border-line text-ink hover:bg-paper"
                }`}
              >
                {myRsvps.includes(c.id) ? "✓ I'm going" : "I'm going"}
              </button>
              <button
                onClick={() => setBookingCampId(c.id)}
                className="inline-flex min-h-[44px] items-center rounded-[3px] border border-line px-5 py-2.5 text-sm font-semibold text-ink hover:bg-paper"
              >
                Book a slot
              </button>
              <a
                href={icsHref(c)}
                download={`${c.name.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "") || "camp"}.ics`}
                className="inline-flex min-h-[44px] items-center rounded-[3px] border border-line px-5 py-2.5 text-sm font-semibold text-ink hover:bg-paper"
              >
                Add to calendar
              </a>
            </div>
          )}
        </>
      )}
      {(c.rsvps ?? 0) > 0 && (
        <p className="tnum mt-2 text-xs font-medium text-faint" aria-live="polite">
          {c.rsvps} {c.rsvps === 1 ? "person" : "people"} going
          {myRsvps.includes(c.id) ? " — including you" : ""}
        </p>
      )}
    </article>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blood camps"
        subtitle="Scheduled donation drives near you — the easiest way to donate: show up, donate, done."
      />

      {upcoming.length === 0 ? (
        <EmptyState
          kind="calendar"
          title="No upcoming camps"
          body="No drives scheduled yet. Organising one — a college, office, or neighbourhood camp? List it here so donors find it."
          action={
            <button
              onClick={() => setShowForm(true)}
              className="rounded-[3px] bg-signal px-5 py-2.5 text-sm font-semibold text-cream min-h-[44px]"
            >
              List a camp
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {upcoming.map((c) => campCard(c, false))}
        </div>
      )}

      {past.length > 0 && (
        <section aria-label="Past camps">
          <h2 className="mb-3 text-sm font-bold text-ink">Past camps</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {past.map((c) => campCard(c, true))}
          </div>
        </section>
      )}

      <div className="border-t border-line pt-5">
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-[3px] border border-dashed border-line px-5 py-3 text-sm font-semibold text-soot hover:bg-cream min-h-[44px] w-full sm:w-auto"
          >
            + List a blood camp
          </button>
        ) : (
          <section aria-label="List a blood camp" className="rounded-[4px] border border-line bg-cream p-5 sm:p-6">
            <h2 className="font-display text-[24px] font-semibold tracking-tight text-ink">List a blood camp</h2>
            <p className="mt-1 text-sm text-soot">
              Organising a drive? Post the details — donors in the area will find it here.
            </p>
            <form onSubmit={submit} className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Camp name">
                  <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} placeholder="e.g. Riverside Apartments Drive" className={inputCls} />
                </Field>
                <Field label="Organiser (optional)">
                  <input value={organiser} onChange={(e) => setOrganiser(e.target.value)} maxLength={80} placeholder="e.g. Rotary Club" className={inputCls} />
                </Field>
                <Field label="Venue">
                  <input value={venue} onChange={(e) => setVenue(e.target.value)} required maxLength={120} placeholder="e.g. Community Hall, 3rd Cross St" className={inputCls} />
                </Field>
                <Field label="Area">
                  <input value={area} onChange={(e) => setArea(e.target.value)} required maxLength={60} placeholder="e.g. Tambaram" className={inputCls} />
                </Field>
                <Field label="Date">
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required min={today} className={inputCls} />
                </Field>
                <Field label="Organiser phone">
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} required maxLength={20} placeholder="+91 ..." className={inputCls} />
                </Field>
                <Field label="Start time (optional)">
                  <input value={startTime} onChange={(e) => setStartTime(e.target.value)} maxLength={20} placeholder="e.g. 9:00 AM" className={inputCls} />
                </Field>
                <Field label="End time (optional)">
                  <input value={endTime} onChange={(e) => setEndTime(e.target.value)} maxLength={20} placeholder="e.g. 1:00 PM" className={inputCls} />
                </Field>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="submit" className="rounded-[3px] bg-signal px-5 py-2.5 text-sm font-semibold text-cream hover:bg-ember min-h-[44px]">
                  List camp
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
