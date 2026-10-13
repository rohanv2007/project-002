import type { BloodBank, BloodGroup, BloodRequest, Donor } from "./types";
import {
  BLOOD_GROUPS,
  COMPATIBLE_DONORS,
  isEffectivelyAvailable,
  isEligibleByInterval,
  isRare,
} from "./blood";

/**
 * Shortage engine (researched insight: the Red Cross Blood Donor app's
 * geo-targeted shortage alerts — "your blood type is needed in your area").
 * Demand comes from open requests weighted by urgency; supply from ready
 * donors (compatible with each group) plus blood-bank stock.
 */

const URGENCY_WEIGHT: Record<BloodRequest["urgency"], number> = {
  critical: 3,
  urgent: 1.5,
  scheduled: 1,
};

export interface GroupNeed {
  group: BloodGroup;
  openRequests: number; // number of open requests for this exact group
  demandUnits: number; // urgency-weighted units demanded
  readyDonors: number; // ready donors whose blood is compatible
  bankStock: number; // units on hand across banks
}

export type NeedLevel = "ok" | "watch" | "shortage";

export function computeGroupNeeds(
  donors: Donor[],
  requests: BloodRequest[],
  banks: BloodBank[],
  now: Date = new Date()
): GroupNeed[] {
  const open = requests.filter(
    (r) => r.status === "open" && new Date(r.expiresAt) > now
  );
  const ready = donors.filter(
    (d) => isEffectivelyAvailable(d) && isEligibleByInterval(d.lastDonation, now)
  );
  return BLOOD_GROUPS.map((group) => {
    const groupRequests = open.filter((r) => r.group === group);
    const demandUnits = groupRequests.reduce(
      (s, r) => s + r.units * URGENCY_WEIGHT[r.urgency],
      0
    );
    const readyDonors = ready.filter((d) =>
      COMPATIBLE_DONORS[group].includes(d.group)
    ).length;
    const bankStock = banks.reduce((s, b) => s + (b.stock[group] ?? 0), 0);
    return {
      group,
      openRequests: groupRequests.length,
      demandUnits: Math.round(demandUnits * 10) / 10,
      readyDonors,
      bankStock,
    };
  });
}

export function needLevel(n: GroupNeed): NeedLevel {
  if (n.demandUnits <= 0) return "ok";
  const effectiveSupply = n.readyDonors + Math.floor(n.bankStock / 2);
  if (n.demandUnits >= effectiveSupply && n.demandUnits >= 2) return "shortage";
  if (effectiveSupply <= n.demandUnits) return "watch";
  return "ok";
}

export function needReason(n: GroupNeed): string {
  if (n.demandUnits <= 0) return "No open demand";
  const bits: string[] = [`${n.openRequests} open request${n.openRequests === 1 ? "" : "s"}`];
  if (isRare(n.group)) bits.push("rare group");
  if (n.readyDonors === 0) bits.push("no ready donor");
  if (n.bankStock < 2) bits.push("bank stock low");
  return bits.join(" · ");
}

/** Top groups to alert on, shortage first, then watch — capped. */
export function topAlerts(
  needs: GroupNeed[],
  limit = 4
): { need: GroupNeed; level: NeedLevel }[] {
  return needs
    .map((need) => ({ need, level: needLevel(need) }))
    .filter((x) => x.level !== "ok")
    .sort((a, b) => {
      const rank: Record<Exclude<NeedLevel, "ok">, number> = { shortage: 0, watch: 1 };
      const al = a.level as Exclude<NeedLevel, "ok">;
      const bl = b.level as Exclude<NeedLevel, "ok">;
      if (rank[al] !== rank[bl]) return rank[al] - rank[bl];
      return b.need.demandUnits - a.need.demandUnits;
    })
    .slice(0, limit);
}
