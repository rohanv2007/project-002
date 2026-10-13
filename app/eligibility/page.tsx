"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SCREEN_QUESTIONS, evaluateScreen } from "@/lib/eligibility";
import { activeDeferralFor, formatDate } from "@/lib/blood";
import { useDeferrals, uid } from "@/lib/store";
import { PageHeader } from "@/components/ui";

export default function Eligibility() {
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [lastDonation, setLastDonation] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [deferrals, , addDeferral, , removeDeferral] = useDeferrals();
  const [deferReason, setDeferReason] = useState("");
  const [deferUntil, setDeferUntil] = useState("");
  const [deferSaved, setDeferSaved] = useState(false);

  const myDeferral = activeDeferralFor(deferrals, null);

  const answered = Object.keys(answers).length;
  const total = SCREEN_QUESTIONS.length;
  const result = useMemo(
    () => (submitted ? evaluateScreen(answers, lastDonation || null) : null),
    [submitted, answers, lastDonation]
  );

  const set = (id: string, v: boolean) => {
    setAnswers((a) => ({ ...a, [id]: v }));
    setSubmitted(false);
  };

  const progress = Math.round((answered / total) * 100);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="2-minute eligibility check"
        subtitle="Answer honestly. This self-screen mirrors what blood banks ask — it saves you a wasted trip, and it never replaces the bank's own check."
      />

      {!result && (
        <div className="space-y-4">
          <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-signal transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs font-medium text-faint tnum" aria-live="polite">
            {answered} of {total} answered
          </p>

          <div className="rounded-[4px] border border-line bg-cream p-5">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">
                When did you last donate blood? <span className="font-normal text-faint">(optional)</span>
              </span>
              <input
                type="date"
                value={lastDonation}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setLastDonation(e.target.value)}
                className="w-full rounded-[3px] border border-line bg-cream px-3.5 py-2.5 text-sm min-h-[44px]"
              />
            </label>
          </div>

          <ol className="space-y-3">
            {SCREEN_QUESTIONS.map((q, i) => (
              <li key={q.id} className="rounded-[4px] border border-line bg-cream p-5">
                <p className="text-sm font-semibold text-ink">
                  <span className="tnum mr-2 text-faint">{i + 1}.</span>
                  {q.text}
                </p>
                {q.hint && <p className="mt-1 text-xs text-faint">{q.hint}</p>}
                <div className="mt-3 grid grid-cols-2 gap-2" role="group" aria-label={q.text}>
                  {([true, false] as const).map((v) => {
                    const selected = answers[q.id] === v;
                    return (
                      <button
                        key={String(v)}
                        type="button"
                        onClick={() => set(q.id, v)}
                        aria-pressed={selected}
                        className={`rounded-[3px] border px-4 py-2.5 text-sm font-semibold min-h-[44px] ${
                          selected
                            ? "border-signal bg-signal text-cream"
                            : "border-line bg-cream text-soot hover:bg-paper"
                        }`}
                      >
                        {v ? "Yes" : "No"}
                      </button>
                    );
                  })}
                </div>
              </li>
            ))}
          </ol>

          <button
            type="button"
            disabled={answered < total}
            onClick={() => setSubmitted(true)}
            className="w-full rounded-[3px] bg-signal px-6 py-3.5 text-sm font-semibold text-cream hover:bg-ember disabled:cursor-not-allowed disabled:bg-line"
          >
            {answered < total ? `Answer all ${total} questions to see your result` : "See my result"}
          </button>
        </div>
      )}

      {result && (
        <div className="space-y-4" role="status">
          <div
            className={`rounded-[4px] border p-6 sm:p-8 ${
              result.eligible
                ? "border-moss bg-cream"
                : "border-line bg-cream"
            }`}
          >
            <p className={`text-xl font-bold ${result.eligible ? "text-moss" : "text-gold"}`}>
              {result.eligible ? "You're likely eligible to donate" : "Not just yet — here's why"}
            </p>
            {result.eligible ? (
              <div className="mt-3 space-y-3 text-sm text-moss">
                <p>
                  You passed the self-screen. The blood bank will still run its own
                  checks (haemoglobin, blood pressure, medical history) on the day —
                  that's normal and free.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Link href="/donors/register" className="rounded-[3px] bg-moss px-5 py-2.5 text-center text-sm font-semibold text-cream hover:bg-moss min-h-[44px] inline-flex items-center justify-center">
                    Register as a donor
                  </Link>
                  <Link href="/camps" className="rounded-[3px] border border-moss px-5 py-2.5 text-center text-sm font-semibold text-moss hover:bg-cream min-h-[44px] inline-flex items-center justify-center">
                    Find a camp &amp; book a slot
                  </Link>
                  <button onClick={() => setSubmitted(false)} className="rounded-[3px] px-5 py-2.5 text-sm font-semibold text-moss hover:bg-cream min-h-[44px]">
                    Retake the check
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                <ul className="space-y-2">
                  {result.failures.map((f, i) => (
                    <li key={i} className="rounded-[3px] bg-cream/70 px-4 py-3 text-sm text-gold ring-1 ring-inset ring-line">
                      <p className="font-medium">{f.reason}</p>
                      {f.deferral && <p className="mt-1 text-xs">{f.deferral}</p>}
                    </li>
                  ))}
                </ul>
                {result.nextEligible && (
                  <p className="text-sm font-semibold text-gold">
                    Next eligible date: {formatDate(result.nextEligible)}
                  </p>
                )}
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Link href="/learn" className="rounded-[3px] border border-gold px-5 py-2.5 text-center text-sm font-semibold text-gold hover:bg-cream min-h-[44px] inline-flex items-center justify-center">
                    Read the donor FAQs
                  </Link>
                  <button onClick={() => setSubmitted(false)} className="rounded-[3px] px-5 py-2.5 text-sm font-semibold text-gold hover:bg-cream min-h-[44px]">
                    Retake the check
                  </button>
                </div>
              </div>
            )}
          </div>
          <p className="text-xs text-faint">
            This is a self-screen based on India's NACO donor guidelines, not medical
            advice. The blood bank's medical officer makes the final call.
          </p>
        </div>
      )}

      {/* Blood-bank deferral log: if a bank turned you away (low haemoglobin,
          recent tattoo, illness…), record it so the network stops counting you
          as ready until the deferral lifts. Mirrors e-RaktKosh's practice of
          blocking donors based on health and donation history. */}
      <section aria-label="Log a blood-bank deferral" className="mt-8 rounded-[4px] border border-line bg-cream p-5">
        <h2 className="text-sm font-bold text-ink">Were you deferred at a blood bank?</h2>
        <p className="mt-1 text-xs text-faint">
          Banks defer donors for health reasons — low haemoglobin, a recent tattoo or
          surgery, an illness. Logging it here keeps you out of emergency matches
          until you're cleared, automatically.
        </p>
        {myDeferral ? (
          <div className="mt-4 rounded-[3px] bg-cream p-4 ring-1 ring-inset ring-line">
            <p className="text-sm font-semibold text-gold">
              Deferred until {formatDate(myDeferral.deferredUntil)}
            </p>
            <p className="mt-0.5 text-xs text-gold">{myDeferral.reason}</p>
            <button
              onClick={() => removeDeferral(myDeferral.id)}
              className="mt-2 text-xs font-semibold text-gold underline-offset-2 hover:underline min-h-[44px]"
            >
              Cleared early — remove this deferral
            </button>
          </div>
        ) : deferSaved ? (
          <p role="status" className="mt-4 rounded-[3px] bg-cream p-4 text-sm font-medium text-moss ring-1 ring-inset ring-line">
            Deferral logged. You'll sit out of emergency matches until it's cleared —
            your "My donations" page will show the date.
          </p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-soot">Reason for deferral</span>
              <input
                type="text"
                value={deferReason}
                onChange={(e) => setDeferReason(e.target.value)}
                placeholder="e.g. Low haemoglobin (10.8 g/dL)"
                className="w-full rounded-[3px] border border-line bg-cream px-3.5 py-2.5 text-sm min-h-[44px]"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-soot">Deferred until</span>
              <input
                type="date"
                value={deferUntil}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDeferUntil(e.target.value)}
                className="rounded-[3px] border border-line bg-cream px-3.5 py-2.5 text-sm min-h-[44px]"
              />
            </label>
            <button
              disabled={!deferReason.trim() || !deferUntil}
              onClick={() => {
                addDeferral({
                  id: uid("dfr"),
                  donorId: null,
                  reason: deferReason.trim(),
                  deferredUntil: deferUntil,
                  createdAt: new Date().toISOString(),
                });
                setDeferReason("");
                setDeferUntil("");
                setDeferSaved(true);
              }}
              className="rounded-[3px] bg-ink px-5 py-2.5 text-sm font-semibold text-cream hover:bg-ink disabled:cursor-not-allowed disabled:bg-line sm:col-span-2"
            >
              Log this deferral
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
