import { DONATION_INTERVAL_DAYS, daysSince, formatDate } from "./blood";

export interface ScreenQuestion {
  id: string;
  text: string;
  hint?: string;
  /** the answer that counts as a pass */
  passWhen: boolean;
  failReason: string;
  /** how long until this can pass, in plain words */
  deferral?: string;
}

export const SCREEN_QUESTIONS: ScreenQuestion[] = [
  {
    id: "age",
    text: "Are you between 18 and 65 years old?",
    passWhen: true,
    failReason: "Blood donation in India is open to ages 18–65.",
    deferral: "You can donate once you turn 18.",
  },
  {
    id: "weight",
    text: "Do you weigh at least 45 kg?",
    hint: "The minimum weight for whole-blood donation in India.",
    passWhen: true,
    failReason: "Donors must weigh at least 45 kg for a safe donation.",
  },
  {
    id: "healthy",
    text: "Are you feeling healthy today — no cold, fever, flu or infection in the last 14 days?",
    passWhen: true,
    failReason: "Donation is deferred until you're fully recovered from any infection.",
    deferral: "Wait 14 days after full recovery.",
  },
  {
    id: "antibiotics",
    text: "Have you taken antibiotics in the last 14 days?",
    passWhen: false,
    failReason: "Recent antibiotic use usually means a recent infection.",
    deferral: "Wait 14 days after finishing the course.",
  },
  {
    id: "tattoo",
    text: "Have you had a tattoo, piercing, or acupuncture in the last 12 months?",
    passWhen: false,
    failReason: "Skin procedures carry a small infection risk window.",
    deferral: "Wait 12 months from the procedure date.",
  },
  {
    id: "surgery",
    text: "Have you had major surgery or a blood transfusion in the last 12 months?",
    passWhen: false,
    failReason: "Your body needs a full recovery window after major surgery.",
    deferral: "Wait 12 months after surgery or transfusion.",
  },
  {
    id: "pregnancy",
    text: "Are you currently pregnant, or have you delivered in the last 12 months?",
    hint: "Answer “No” if this doesn't apply to you.",
    passWhen: false,
    failReason: "Pregnancy and the first year after delivery are deferral periods.",
    deferral: "You can donate 12 months after delivery.",
  },
  {
    id: "conditions",
    text: "Do you have diabetes on insulin, heart disease, hepatitis B/C, or HIV?",
    passWhen: false,
    failReason: "These conditions permanently defer blood donation for recipient safety.",
  },
  {
    id: "haemoglobin",
    text: "Is your haemoglobin 12.5 g/dL or above (if you know it)?",
    hint: "Don't know? Answer “Yes” — the blood bank tests this for free before every donation.",
    passWhen: true,
    failReason: "Low haemoglobin is the most common temporary deferral — iron-rich food helps.",
    deferral: "Re-check after 3 months of iron-rich diet.",
  },
];

export interface ScreenResult {
  eligible: boolean;
  failures: { reason: string; deferral?: string }[];
  nextEligible: string | null; // ISO date if interval-based deferral applies
}

export function evaluateScreen(answers: Record<string, boolean>, lastDonation: string | null): ScreenResult {
  const failures: ScreenResult["failures"] = [];
  for (const q of SCREEN_QUESTIONS) {
    const a = answers[q.id];
    if (a === undefined) continue;
    if (a !== q.passWhen) failures.push({ reason: q.failReason, deferral: q.deferral });
  }
  let nextEligible: string | null = null;
  if (lastDonation) {
    const since = daysSince(lastDonation);
    if (since < DONATION_INTERVAL_DAYS) {
      const d = new Date(lastDonation + "T00:00:00");
      d.setDate(d.getDate() + DONATION_INTERVAL_DAYS);
      nextEligible = d.toISOString().slice(0, 10);
      failures.push({
        reason: `Your last donation was ${since} day${since === 1 ? "" : "s"} ago — India requires a ${DONATION_INTERVAL_DAYS}-day gap between donations.`,
        deferral: `You become eligible again on ${formatDate(nextEligible)}.`,
      });
    }
  }
  return { eligible: failures.length === 0, failures, nextEligible };
}
