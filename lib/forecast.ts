/**
 * Seasonal demand forecasting for India (static model).
 *
 * Event-based demand forecasting is what e-RaktKosh does at national scale;
 * this is the local version: which months run hot, why, and what donors can
 * do about it *before* the peak hits. A unit donated 2–3 weeks before a peak
 * is far more useful than one donated after it.
 */

export type DemandLevel = "peak" | "high" | "normal";

export interface SeasonMonth {
  month: number; // 1-12
  name: string;
  level: DemandLevel;
  drivers: string[];
  tip: string;
}

export const SEASONAL_DEMAND: SeasonMonth[] = [
  { month: 1, name: "January", level: "normal", drivers: ["Winter surgeries resume"], tip: "A steady month — regular donors keep stock balanced." },
  { month: 2, name: "February", level: "normal", drivers: ["College blood camps run"], tip: "Camp season — join one if you see it on campus." },
  { month: 3, name: "March", level: "high", drivers: ["Exam season — college camps dry up"], tip: "Camps stop but patients don't. Donate now to cover the dip." },
  { month: 4, name: "April", level: "high", drivers: ["Early heat, fewer walk-in donors"], tip: "Walk-in donations fall — your donation counts double." },
  { month: 5, name: "May", level: "peak", drivers: ["Summer vacation", "Colleges closed — no camps"], tip: "The year's first trough. Donate in late April to build stock." },
  { month: 6, name: "June", level: "peak", drivers: ["Heatwave injuries", "Blood stocks at annual lows"], tip: "If you were eligible in May, this is your moment." },
  { month: 7, name: "July", level: "high", drivers: ["Monsoon road accidents rise"], tip: "Trauma demand climbs — rare groups especially valuable." },
  { month: 8, name: "August", level: "peak", drivers: ["Dengue season begins", "Platelet + blood demand spikes"], tip: "Dengue peaks Aug–Oct. Donate before the wave, not during it." },
  { month: 9, name: "September", level: "peak", drivers: ["Dengue peak", "Festival travel accidents"], tip: "Banks run hottest here. Eligible? Go this week." },
  { month: 10, name: "October", level: "high", drivers: ["Dengue tail", "Diwali injuries"], tip: "Donate early October — beats the festival rush." },
  { month: 11, name: "November", level: "normal", drivers: ["Wedding season — scheduled transfusions steady"], tip: "Thalassemia and dialysis patients need transfusions every 3–4 weeks, all year — steady donors matter most." },
  { month: 12, name: "December", level: "normal", drivers: ["Holiday donors dip", "Year-end camps"], tip: "Close the year with a donation — you become eligible again in March." },
];

export const YEAR_ROUND_DRIVER =
  "Thalassemia and dialysis patients need transfusions every 3–4 weeks, all year — they are the quietest, steadiest demand.";

export function forecastFrom(month1to12: number): SeasonMonth[] {
  // Next 3 months, wrapping around the year.
  return [0, 1, 2].map((i) => SEASONAL_DEMAND[((month1to12 - 1 + i) % 12 + 12) % 12]);
}

export function levelBadge(level: DemandLevel): { label: string; cls: string } {
  if (level === "peak") return { label: "Peak", cls: "bg-crimson-600 text-white" };
  if (level === "high") return { label: "High", cls: "bg-amber-100 text-amber-900 ring-1 ring-inset ring-amber-300" };
  return { label: "Steady", cls: "bg-ink-100 text-ink-700 ring-1 ring-inset ring-ink-200" };
}
