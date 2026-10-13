export interface Team {
  id: string;
  name: string;
  description: string;
  memberIds: string[]; // donor ids
  createdAt: string;
}

export type BloodGroup = "O-" | "O+" | "A-" | "A+" | "B-" | "B+" | "AB-" | "AB+";

/** The blood component a request asks for. Whole blood is the default. */
export type BloodComponent = "whole" | "plasma" | "platelets";

export const BLOOD_COMPONENTS: BloodComponent[] = ["whole", "plasma", "platelets"];

export interface Donor {
  id: string;
  name: string;
  group: BloodGroup;
  phone: string;
  area: string;
  available: boolean;
  /** ISO date (YYYY-MM-DD) after which the donor auto-resumes; null = indefinite pause */
  awayUntil?: string | null;
  lastDonation: string | null; // ISO date, e.g. "2026-06-14"
  donations: number; // lifetime count
  createdAt: string; // ISO timestamp
  /**
   * Rare phenotype (e.g. "Bombay (Oh)", "Rh-null") — mirrors the national
   * ICMR-NIIH rare donor registry. Only set when the donor knows it.
   */
  rarePhenotype?: string | null;
  /**
   * Open to platelet/plasma donation via apheresis (60–90 min at the bank).
   * Spotlighted when a request needs platelets or plasma.
   */
  openToApheresis?: boolean;
}

export interface BloodRequest {
  id: string;
  patientName: string;
  group: BloodGroup;
  units: number;
  /** Blood component needed; defaults to whole blood for older requests. */
  component?: BloodComponent;
  hospital: string;
  area: string;
  contactName: string;
  contactPhone: string;
  urgency: "critical" | "urgent" | "scheduled";
  notes: string;
  status: "open" | "fulfilled" | "expired";
  createdAt: string;
  expiresAt: string;
  /** Rare phenotype the patient needs (e.g. "Bombay (Oh)"), when the family knows it. */
  rarePhenotypeNeeded?: string | null;
  /** Donors who committed to donate toward this request. */
  pledges?: Array<{
    id: string;
    donorName: string;
    phone: string;
    units: number;
    createdAt: string;
    /** Set once the donation was confirmed and written into donor history — prevents double-counting. */
    recorded?: boolean;
  }>;
}

export interface BloodBank {
  id: string;
  name: string;
  area: string;
  phone: string;
  hours: string;
  stock: Record<BloodGroup, number>; // units on hand
  /** ISO timestamp of the last stock update. Optional: older data lacks it. */
  updatedAt?: string;
}

export interface DonationRecord {
  id: string;
  donorId: string | null; // null for "my" self-tracked donations
  date: string; // ISO date
  units: number;
  location: string;
  /** Blood journey stage: 0 logged → 1 at blood bank → 2 dispatched → 3 reached a patient */
  journey?: number;
  /** Mini-physical results taken at the camp (BP, pulse, hemoglobin, weight). Optional. */
  vitals?: DonationVitals;
}

/**
 * The quick health check every blood bank runs before you donate —
 * the same "mini-physical" the American Red Cross app surfaces in its
 * donor card (blood pressure, pulse, hemoglobin). Tracking it here helps
 * donors spot low-hemoglobin deferrals early and watch them improve.
 */
export interface DonationVitals {
  /** Hemoglobin in g/dL — India's donation cutoff is 12.5 */
  hemoglobin?: number;
  /** Systolic blood pressure (mmHg) */
  systolic?: number;
  /** Diastolic blood pressure (mmHg) */
  diastolic?: number;
  /** Pulse in beats per minute */
  pulse?: number;
  /** Weight in kg */
  weight?: number;
}

/** India's minimum hemoglobin level accepted for blood donation. */
export const HEMOGLOBIN_CUTOFF_GDL = 12.5;

/**
 * A personal nudge: "remind me when I'm eligible to donate again".
 * Fires (shows a banner) once `forDate` arrives; snoozing pushes it out,
 * dismissing removes it for good.
 */
export interface Reminder {
  id: string;
  kind: "eligibility";
  /** ISO date (YYYY-MM-DD) the reminder becomes due */
  forDate: string;
  note: string;
  createdAt: string;
  snoozedUntil?: string | null;
}

/** A blood donation camp: scheduled drive with a venue, date, and organiser contact. */
export interface CampEvent {
  id: string;
  name: string;
  organiser: string;
  venue: string;
  area: string;
  /** ISO date (YYYY-MM-DD) */
  date: string;
  /** e.g. "9:00 AM" */
  startTime: string;
  /** e.g. "1:00 PM" */
  endTime: string;
  contactPhone: string;
  createdAt: string;
  /** Number of people who tapped "I'm going". Community RSVP count. */
  rsvps?: number;
}

/**
 * A commit-to-give pledge: "I will donate on this date".
 * Research (Red Cross donor-retention work) shows scheduling the next
 * donation dramatically increases the chance a donor actually returns.
 */
export interface Pledge {
  id: string;
  /** ISO date (YYYY-MM-DD) the donor committed to */
  forDate: string;
  location: string;
  createdAt: string;
}

/**
 * A blood-group watch: "tell me when an O- donor registers in my area".
 * Mirrors the targeted individual alerts real blood services send.
 */
export interface Watch {
  id: string;
  group: BloodGroup;
  /** free-text locality */
  area: string;
  createdAt: string;
}

export interface Deferral {
  id: string;
  /**
   * Registered donor id, or null for the browser owner's own deferral
   * (logged from the eligibility check). Blood banks defer donors for
   * health reasons — low hemoglobin, recent tattoo, illness — and the
   * deferral must lift automatically on its end date.
   */
  donorId: string | null;
  reason: string;
  /** ISO date (YYYY-MM-DD) on which the deferral lifts */
  deferredUntil: string;
  createdAt: string;
}

/**
 * A booked donation slot. Researched insight: e-RaktKosh lets donors
 * register, schedule donation appointments, and receive reminders for future
 * donations — booking the slot is what converts intent into a donation.
 */
export interface Appointment {
  id: string;
  kind: "camp";
  refId: string; // camp id
  label: string; // e.g. "Mega Camp · City Hall, Adyar"
  date: string; // ISO date (YYYY-MM-DD)
  slot: string; // e.g. "9:00–10:00 AM"
  createdAt: string;
}

/**
 * A recurring transfusion patient (thalassemia, dialysis, sickle cell…):
 * families re-run the same frantic donor search every few weeks. A profile
 * keeps the details on file and flags the next due date.
 */
export interface Patient {
  id: string;
  name: string;
  group: BloodGroup;
  condition: string;
  hospital: string;
  area: string;
  /** ISO date (YYYY-MM-DD) the next transfusion is due; null = not scheduled */
  nextDue: string | null;
  createdAt: string;
}
