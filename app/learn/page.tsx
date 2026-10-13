import { BLOOD_GROUPS, COMPATIBLE_DONORS } from "@/lib/blood";
import { GroupBadge, PageHeader } from "@/components/ui";

const MYTHS: { myth: string; fact: string }[] = [
  { myth: "Donating blood makes you weak for weeks.", fact: "Your body replaces the fluid within 24 hours and red cells within 4–6 weeks. Most donors are back to normal the same evening." },
  { myth: "You can catch an infection from donating.", fact: "Every needle is sterile and single-use, opened in front of you. There is no way to catch an infection from donating blood." },
  { myth: "You need to be a frequent donor for it to matter.", fact: "One donation can save up to three lives — red cells, platelets and plasma go to different patients." },
  { myth: "Vegetarians can't donate.", fact: "Diet doesn't disqualify you. The bank checks your haemoglobin on the spot — eat iron-rich food and you'll usually pass." },
  { myth: "Blood donation is painful.", fact: "It's a brief pinch. The whole donation takes 8–10 minutes; the screening and rest take longer than the needle." },
  { myth: "Hospitals always have enough blood.", fact: "India faces a chronic shortfall of 1–1.5 million units a year. Rare groups run out first — that's why donor registries matter." },
];

const TIPS = [  { h: "Before", items: ["Sleep well the night before.", "Eat a normal meal 2–3 hours prior — never donate on an empty stomach.", "Drink 500 ml of water in the hour before.", "Carry a photo ID."] },
  { h: "During", items: ["Relax your arm and breathe normally.", "Tell the staff if you feel dizzy — it's common and passes.", "The draw itself takes 8–10 minutes."] },
  { h: "After", items: ["Rest 10–15 minutes and have the refreshments.", "Drink extra fluids for the next 24 hours.", "Avoid heavy lifting with that arm for a day.", "If you bruise, a cold compress helps."] },
];

const DONATION_TYPES = [
  {
    name: "Whole blood",
    cadence: "Every 3 months",
    time: "8–10 min draw",
    best: "The default — red cells, platelets and plasma are separated at the lab and can help up to three patients.",
  },
  {
    name: "Platelets (apheresis)",
    cadence: "Every 2 weeks",
    time: "60–90 min",
    best: "For dengue, cancer and surgery patients. Platelets last only ~5 days, so banks run short constantly — regular platelet donors are gold.",
  },
  {
    name: "Plasma (apheresis)",
    cadence: "Every 2 weeks",
    time: "~45 min",
    best: "For burn, liver and clotting-disorder patients. Your red cells are returned to you, so recovery is quick.",
  },
];

const FAQS: Array<{ q: string; a: string }> = [
  {
    q: "Who can donate blood?",
    a: "In India: 18–65 years old, at least 45 kg, hemoglobin 12.5 g/dL or above, and feeling healthy on the day. The eligibility check on this app walks you through the same questions a camp would ask.",
  },
  {
    q: "Does donating hurt?",
    a: "You feel the needle prick for a moment; the actual donation takes about 8–10 minutes. Most donors are surprised by how uneventful it is — the whole visit, including rest and refreshments, is 30–45 minutes.",
  },
  {
    q: "How often can I donate?",
    a: "Whole blood every 90 days in India (the gap this app tracks for you). Platelets and plasma via apheresis can be donated every 2 weeks — ask your blood bank if you're curious.",
  },
  {
    q: "Should I eat before donating?",
    a: "Yes — eat a normal meal 2–3 hours before and drink plenty of water. Avoid very fatty food right before (it can affect test results). Skip alcohol for 24 hours before and after.",
  },
  {
    q: "I got a tattoo recently. Can I donate?",
    a: "Most banks ask you to wait after a tattoo or piercing. Be honest about it in the eligibility check — it protects both you and the recipient, and the wait is temporary.",
  },
  {
    q: "Will donating make me weak?",
    a: "Your body replaces the fluid within 24 hours and the red cells within a few weeks. Rest for 15 minutes after donating, hydrate through the day, and avoid heavy lifting with that arm.",
  },
  {
    q: "What is my blood tested for?",
    a: "Every unit in India is screened for HIV, hepatitis B and C, syphilis and malaria, plus your blood group and hemoglobin. If anything needs attention, the bank contacts you confidentially.",
  },
  {
    q: "Can women donate during their period, pregnancy, or breastfeeding?",
    a: "Menstruation is fine as long as you feel well and your hemoglobin is in range. Pregnancy and breastfeeding are temporary deferrals — your body needs its iron. You'll be welcomed back after.",
  },
];

export default function Learn() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        title="Learn about donation"
        subtitle="Straight answers, no scare tactics. Knowing the facts is what turns a willing person into a regular donor."
      />

      <section className="rounded-2xl border border-ink-200 bg-white p-5 sm:p-6">
        <h2 className="text-base font-bold text-ink-900">Can I donate? The short version</h2>
        <ul className="mt-3 grid gap-2 text-sm text-ink-700 sm:grid-cols-2">
          {["Age 18–65", "Weight 45 kg or more", "Feeling healthy today", "Haemoglobin 12.5 g/dL+", "90 days since last donation", "No recent tattoo, surgery or infection"].map((c) => (
            <li key={c} className="flex items-start gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-800" aria-hidden="true">✓</span>
              {c}
            </li>
          ))}
        </ul>
        <a href="/eligibility" className="mt-4 inline-block rounded-xl bg-crimson-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-crimson-700">
          Take the full 2-minute check
        </a>
      </section>

      <section aria-label="Donation types and cadence">
        <h2 className="mb-1 text-base font-bold text-ink-900">Three ways to donate — and how often</h2>
        <p className="mb-3 text-sm text-ink-600">
          Whole blood isn't the only option. Component donors can give far more often, which is exactly what shortage-prone banks need.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {DONATION_TYPES.map((t) => (
            <div key={t.name} className="rounded-2xl border border-ink-200 bg-white p-5">
              <h3 className="text-sm font-bold text-ink-900">{t.name}</h3>
              <p className="tnum mt-1 text-xs font-bold uppercase tracking-wide text-crimson-700">{t.cadence}</p>
              <p className="mt-0.5 text-xs text-ink-500">{t.time}</p>
              <p className="mt-2 text-sm text-ink-700">{t.best}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-bold text-ink-900">Myths vs facts</h2>
        <div className="space-y-3">
          {MYTHS.map((m) => (
            <details key={m.myth} className="group rounded-2xl border border-ink-200 bg-white px-5 py-4">
              <summary className="cursor-pointer list-none text-sm font-semibold text-ink-900">
                <span className="mr-2 inline-block rounded bg-crimson-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-crimson-700">Myth</span>
                {m.myth}
              </summary>
              <p className="mt-2 text-sm text-ink-600">
                <span className="mr-2 inline-block rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-green-800">Fact</span>
                {m.fact}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-bold text-ink-900">Before, during, after</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {TIPS.map((t) => (
            <div key={t.h} className="rounded-2xl border border-ink-200 bg-white p-5">
              <h3 className="text-sm font-bold text-crimson-700">{t.h}</h3>
              <ul className="mt-2 space-y-1.5 text-sm text-ink-700">
                {t.items.map((i) => <li key={i} className="flex gap-2"><span aria-hidden="true" className="text-ink-300">•</span>{i}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-purple-200 bg-purple-50/50 p-5 sm:p-6">
        <h2 className="text-base font-bold text-ink-900">Rare phenotypes: beyond the blood group</h2>
        <p className="mt-1 text-sm text-ink-600">
          Some people carry rare blood features — Bombay (Oh), Rh-null, or rare antigen
          combinations — that a regular blood-group label misses. In June 2025, India's
          ICMR-NIIH launched the country's first national rare donor registry (being
          integrated with e-RaktKosh) precisely because these patients are the hardest
          to match in an emergency.
        </p>
        <ul className="mt-3 space-y-2 text-sm text-ink-700">
          <li className="flex gap-2"><span aria-hidden="true" className="text-purple-700">•</span>If a lab has ever told you that you have Bombay (Oh) or Rh-null blood, tag it on your Raktha donor registration — requests that need it will spotlight you.</li>
          <li className="flex gap-2"><span aria-hidden="true" className="text-purple-700">•</span>If a hospital asks for a rare phenotype for a patient, add it to the request — matching donors rise to the top of the call list automatically.</li>
        </ul>
      </section>

      <section aria-label="Frequently asked questions" className="rounded-2xl border border-ink-200 bg-white p-5 sm:p-6">
        <h2 className="text-base font-bold text-ink-900">Frequently asked questions</h2>
        <p className="mt-1 text-sm text-ink-600">
          The answers first-time donors ask most — straight from blood-bank guidance.
        </p>
        <div className="mt-4 divide-y divide-ink-100 rounded-xl border border-ink-200">
          {FAQS.map((f) => (
            <details key={f.q} className="group px-4 py-3">
              <summary className="cursor-pointer list-none text-sm font-semibold text-ink-900 marker:hidden min-h-[44px] flex items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
                <span>{f.q}</span>
                <span aria-hidden="true" className="shrink-0 text-lg font-normal text-crimson-600 group-open:hidden">+</span>
                <span aria-hidden="true" className="hidden shrink-0 text-lg font-normal text-crimson-600 group-open:inline">−</span>
              </summary>
              <p className="mt-1 pb-1 text-sm leading-relaxed text-ink-600">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-ink-200 bg-white p-5 sm:p-6">
        <h2 className="text-base font-bold text-ink-900">Who can give to whom</h2>
        <p className="mt-1 text-sm text-ink-600">Red-cell compatibility. O− donors can give to everyone; AB+ patients can receive from everyone.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <caption className="sr-only">Blood group compatibility: which donor groups each patient group can receive from</caption>
            <thead>
              <tr>
                <th scope="col" className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">Patient</th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">Can receive from</th>
              </tr>
            </thead>
            <tbody>
              {BLOOD_GROUPS.map((g) => (
                <tr key={g} className="border-t border-ink-100">
                  <th scope="row" className="px-3 py-2.5 text-left"><GroupBadge group={g} size="sm" /></th>
                  <td className="px-3 py-2.5">
                    <span className="flex flex-wrap gap-1.5">
                      {COMPATIBLE_DONORS[g].map((d) => <GroupBadge key={d} group={d} size="sm" />)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
