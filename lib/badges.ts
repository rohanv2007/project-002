/** Donor milestone badges: gamification that means something — each tier is
 * a count of real donations. Single source of truth for My Donations and
 * the donor directory. */

export interface MilestoneTier {
  n: number;
  label: string;
  desc: string;
}

export const MILESTONE_TIERS: MilestoneTier[] = [
  { n: 1, label: "First drop", desc: "Your first donation — up to 3 lives touched." },
  { n: 5, label: "Lifeline", desc: "5 donations. You're someone's regular hope." },
  { n: 10, label: "Champion", desc: "10 donations. A rare, steady giver." },
  { n: 25, label: "Legend", desc: "25 donations. A lifetime of quiet heroism." },
];

/** Highest tier earned for a lifetime donation count, or null. */
export function badgeFor(donations: number): MilestoneTier | null {
  let earned: MilestoneTier | null = null;
  for (const tier of MILESTONE_TIERS) {
    if (donations >= tier.n) earned = tier;
  }
  return earned;
}

/** Shareable brag text for an earned badge. */
export function buildBadgeShareText(tier: MilestoneTier, donations: number): string {
  return [
    `I just reached ${donations} blood donation${donations === 1 ? "" : "s"} on Raktha — "${tier.label}" badge earned.`,
    tier.desc,
    "You can save lives too. Register as a blood donor.",
  ].join("\n");
}

const STREAK_WINDOW_MS = 90 * 86400_000;

/**
 * Donation streak: consecutive 90-day windows (anchored at the latest
 * donation) that each contain at least one donation. Regular repeat donors
 * are every blood service's stated goal — frequency in the early years
 * predicts long-term commitment.
 */
export function donationStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const times = dates
    .map((d) => new Date(d + "T00:00:00").getTime())
    .filter((t) => !Number.isNaN(t))
    .sort((a, b) => b - a);
  if (times.length === 0) return 0;
  const latest = times[0];
  let streak = 0;
  let k = 0;
  while (k < 100) {
    const hi = latest - k * STREAK_WINDOW_MS;
    const lo = latest - (k + 1) * STREAK_WINDOW_MS;
    if (!times.some((t) => t > lo && t <= hi)) break;
    streak++;
    k++;
  }
  return streak;
}
