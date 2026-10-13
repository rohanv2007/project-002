import type { BloodComponent, BloodGroup, Deferral, Donor, Watch } from "./types";

export const BLOOD_GROUPS: BloodGroup[] = [  "O-",
  "O+",
  "A-",
  "A+",
  "B-",
  "B+",
  "AB-",
  "AB+",
];

/**
 * Donor groups that can donate red cells to a given recipient group.
 * O- is the universal red-cell donor; AB+ the universal recipient.
 */
export const COMPATIBLE_DONORS: Record<BloodGroup, BloodGroup[]> = {
  "O-": ["O-"],
  "O+": ["O-", "O+"],
  "A-": ["O-", "A-"],
  "A+": ["O-", "O+", "A-", "A+"],
  "B-": ["O-", "B-"],
  "B+": ["O-", "O+", "B-", "B+"],
  "AB-": ["O-", "A-", "B-", "AB-"],
  "AB+": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
};

/** Groups this donor's blood can go to (recipients). */
export const COMPATIBLE_RECIPIENTS: Record<BloodGroup, BloodGroup[]> = {
  "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
  "O+": ["O+", "A+", "B+", "AB+"],
  "A-": ["A-", "A+", "AB-", "AB+"],
  "A+": ["A+", "AB+"],
  "B-": ["B-", "B+", "AB-", "AB+"],
  "B+": ["B+", "AB+"],
  "AB-": ["AB-", "AB+"],
  "AB+": ["AB+"],
};

/** Rh-negative groups are rare in India (~5-7% of donors). Flagged for priority alerts. */
export const RARE_GROUPS: BloodGroup[] = ["O-", "A-", "B-", "AB-"];

export function isRare(group: BloodGroup): boolean {
  return RARE_GROUPS.includes(group);
}

/**
 * Rare phenotypes tracked alongside the national ICMR-NIIH rare donor
 * registry (launched June 2025, being integrated with e-RaktKosh).
 * Beyond ABO/Rh: donors who know their phenotype can self-tag.
 */
export const RARE_PHENOTYPES = ["Bombay (Oh)", "Rh-null", "Other rare phenotype"] as const;

export function canDonateTo(donor: BloodGroup, recipient: BloodGroup): boolean {
  return COMPATIBLE_DONORS[recipient].includes(donor);
}

/** India (NACO) whole-blood donation interval: 90 days between donations. */
export const DONATION_INTERVAL_DAYS = 90;

/** Red-cell journey stages, mirroring the Red Cross "track your blood to the
 * patient" idea: every logged donation carries its journey forward. */
export const JOURNEY_STAGES = [
  "Logged",
  "At blood bank",
  "Dispatched",
  "Reached a patient",
] as const;

export function daysSince(isoDate: string, now: Date = new Date()): number {
  const then = new Date(isoDate + "T00:00:00");
  return Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
}

/** Next date this donor becomes eligible again. */
export function nextEligibleDate(lastDonation: string | null): Date | null {
  if (!lastDonation) return null;
  const d = new Date(lastDonation + "T00:00:00");
  d.setDate(d.getDate() + DONATION_INTERVAL_DAYS);
  return d;
}

export function isEligibleByInterval(lastDonation: string | null, now: Date = new Date()): boolean {
  if (!lastDonation) return true;
  return daysSince(lastDonation, now) >= DONATION_INTERVAL_DAYS;
}

/**
 * True availability for matching: the manual toggle plus any "away until"
 * return date. Donors auto-resume once the date passes.
 */
export function isEffectivelyAvailable(
  donor: { available: boolean; awayUntil?: string | null },
  now: Date = new Date()
): boolean {
  if (!donor.available) return false;
  if (!donor.awayUntil) return true;
  const end = new Date(donor.awayUntil + "T23:59:59");
  return end < now;
}

/** Human "back on" line for a donor paused with a return date. */
export function awayBackLabel(awayUntil: string | null | undefined): string | null {
  if (!awayUntil) return null;
  const end = new Date(awayUntil + "T23:59:59");
  if (end < new Date()) return null;
  return `Back ${formatDate(awayUntil)}`;
}

/**
 * The currently active deferral for a donor (or for the browser owner when
 * donorId is null). Deferrals lift automatically at the end of their
 * deferredUntil date. Researched: e-RaktKosh's donor management tracks and
 * blocks donors based on health and donation history — a deferral recorded
 * here keeps a turned-away donor out of emergency matches until cleared.
 */
export function activeDeferralFor(
  deferrals: Deferral[],
  donorId: string | null,
  now: Date = new Date()
): Deferral | null {
  const today = now.toISOString().slice(0, 10);
  const actives = deferrals
    .filter((d) => d.donorId === donorId && d.deferredUntil >= today)
    .sort((a, b) => b.deferredUntil.localeCompare(a.deferredUntil));
  return actives[0] ?? null;
}

/** True when a donor id (or the owner) is under an active deferral. */
export function isDeferred(
  deferrals: Deferral[],
  donorId: string | null,
  now: Date = new Date()
): boolean {
  return activeDeferralFor(deferrals, donorId, now) !== null;
}

export function formatDate(isoDate: string): string {
  const d = new Date(isoDate + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Plain-language label for a requested blood component. Researched:
 * e-RaktKosh tracks components (whole blood, plasma, platelets) separately —
 * platelets last ~5 days, so platelet requests genuinely are time-critical.
 */
export function componentLabel(component?: BloodComponent): string {
  switch (component) {
    case "plasma":
      return "plasma";
    case "platelets":
      return "platelets";
    default:
      return "whole blood";
  }
}

/** True when the requested component has the tightest shelf-life logic (platelets). */
export function isComponentUrgent(component?: BloodComponent): boolean {
  return component === "platelets";
}

export function formatDateTime(iso: string): string {  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function timeAgo(iso: string, now: Date = new Date()): string {
  const diff = now.getTime() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return formatDateTime(iso);
}

/**
 * Countdown to a deadline. Returns the label plus an urgent flag when the
 * window is nearly closed (under 6 hours) so cards can colour it.
 */
export function timeUntil(iso: string, now: Date = new Date()): { text: string; urgent: boolean } {
  const diff = new Date(iso).getTime() - now.getTime();
  if (diff <= 0) return { text: "expired", urgent: false };
  const mins = Math.floor(diff / 60000);
  const urgent = diff < 6 * 3600_000;
  if (mins < 60) return { text: `expires in ${mins} min`, urgent };
  const hours = Math.floor(mins / 60);
  if (hours < 48) {
    const rem = mins % 60;
    return { text: rem ? `expires in ${hours}h ${rem}m` : `expires in ${hours}h`, urgent };
  }
  const days = Math.floor(hours / 24);
  const remH = hours % 24;
  return { text: remH ? `expires in ${days}d ${remH}h` : `expires in ${days}d`, urgent };
}

/**
 * Watchlist hits: donors who registered within the last `days` days and
 * match a watch's blood group + locality (researched feature — real blood
 * services send individually targeted alerts for specific groups).
 */
export function freshWatchMatches(
  watches: Watch[],
  donors: Donor[],
  days = 14
): Array<{ watch: Watch; donor: Donor }> {
  const cutoff = Date.now() - days * 86400_000;
  const out: Array<{ watch: Watch; donor: Donor }> = [];
  for (const w of watches) {
    const area = w.area.trim().toLowerCase();
    for (const d of donors) {
      if (d.group !== w.group) continue;
      if (new Date(d.createdAt).getTime() < cutoff) continue;
      if (area && !d.area.toLowerCase().includes(area)) continue;
      out.push({ watch: w, donor: d });
    }
  }
  return out.sort((a, b) => b.donor.createdAt.localeCompare(a.donor.createdAt));
}

/**
 * Indian mobile-number hygiene: a family in a panic types "+91 98765 43210",
 * "098765 43210", or "919876543210" — all reach the same person, but mixed
 * formats break phone matching (pledge → donor history) and tel: links.
 * Normalizes to "+91 98765 43210".
 */
export function normalizeIndianPhone(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return d.length === 10 ? `+91 ${d.slice(0, 5)} ${d.slice(5)}` : raw.trim();
}

/** True Indian mobile: 10 digits, starting 6–9. */
export function isValidIndianMobile(raw: string): boolean {
  const d = normalizeIndianPhone(raw).replace(/\D/g, "").replace(/^91/, "");
  return /^[6-9]\d{9}$/.test(d);
}
