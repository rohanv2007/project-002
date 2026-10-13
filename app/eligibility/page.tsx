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
          <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-ink-200">
            <div className="h-full rounded-full bg-crimson-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs font-medium text-ink-500 tnum" aria-live="polite">
            {answered} of {total} answered
          </p>

          <div className="rounded-2xl border border-ink-200 bg-white p-5">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink-800">
                When did you last donate blood? <span className="font-normal text-ink-500">(optional)</span>
              </span>
              <input
                type="date"
                value={lastDonation}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setLastDonation(e.target.value)}
                className="w-full rounded-xl border border-ink-300 bg-white px-3.5 py-2.5 text-sm min-h-[44px]"
              />
            </label>
          </div>

          <ol className="space-y-3">
            {SCREEN_QUESTIONS.map((q, i) => (
              <li key={q.id} className="rounded-2xl border border-ink-200 bg-white p-5">
                <p className="text-sm font-semibold text-ink-900">
                  <span className="tnum mr-2 text-ink-400">{i + 1}.</span>
                  {q.text}
                </p>
                {q.hint && <p className="mt-1 text-xs text-ink-500">{q.hint}</p>}
                <div className="mt-3 grid grid-cols-2 gap-2" role="group" aria-label={q.text}>
                  {([true, false] as const).map((v) => {
                    const selected = answers[q.id] === v;
                    return (
                      <button
                        key={String(v)}
                        type="button"
                        onClick={() => set(q.id, v)}
                        aria-pressed={selected}
                        className={`rounded-xl border px-4 py-2.5 text-sm font-semibold min-h-[44px] ${
                          selected
                            ? "border-crimson-600 bg-crimson-600 text-white"
                            : "border-ink-300 bg-white text-ink-700 hover:bg-ink-50"
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
            className="w-full rounded-xl bg-crimson-600 px-6 py-3.5 text-sm font-semibold text-white hover:bg-crimson-700 disabled:cursor-not-allowed disabled:bg-ink-300"
          >
            {answered < total ? `Answer all ${total} questions to see your result` : "See my result"}
          </button>
        </div>
      )}

      {result && (
        <div className="space-y-4" role="status">
          <div
            className={`rounded-2xl border p-6 sm:p-8 ${
              result.eligible
                ? "border-green-300 bg-green-50"
                : "border-amber-300 bg-amber-50"
            }`}
          >
            <p className={`text-xl font-bold ${result.eligible ? "text-green-900" : "text-amber-900"}`}>
              {result.eligible ? "You're likely eligible to donate" : "Not just yet — here's why"}
            </p>
            {result.eligible ? (
              <div className="mt-3 space-y-3 text-sm text-green-900">
                <p>
                  You passed the self-screen. The blood bank will still run its own
                  checks (haemoglobin, blood pressure, medical history) on the day —
                  that's normal and free.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Link href="/donors/register" className="rounded-xl bg-green-700 px-5 py-2.5 text-center text-sm font-semibold text-white hover:bg-green-800 min-h-[44px] inline-flex items-center justify-center">
                    Register as a donor
                  </Link>
                  <Link href="/camps" className="rounded-xl border border-green-700 px-5 py-2.5 text-center text-sm font-semibold text-green-800 hover:bg-green-100 min-h-[44px] inline-flex items-center justify-center">
                    Find a camp &amp; book a slot
                  </Link>
                  <button onClick={() => setSubmitted(false)} className="rounded-xl px-5 py-2.5 text-sm font-semibold text-green-800 hover:bg-green-100 min-h-[44px]">
                    Retake the check
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                <ul className="space-y-2">
                  {result.failures.map((f, i) => (
                    <li key={i} className="rounded-xl bg-white/70 px-4 py-3 text-sm text-amber-900 ring-1 ring-inset ring-amber-200">
                      <p className="font-medium">{f.reason}</p>
                      {f.deferral && <p className="mt-1 text-xs">{f.deferral}</p>}
                    </li>
                  ))}
                </ul>
                {result.nextEligible && (
                  <p className="text-sm font-semibold text-amber-900">
                    Next eligible date: {formatDate(result.nextEligible)}
                  </p>
                )}
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Link href="/learn" className="rounded-xl border border-amber-700 px-5 py-2.5 text-center text-sm font-semibold text-amber-800 hover:bg-amber-100 min-h-[44px] inline-flex items-center justify-center">
                    Read the donor FAQs
                  </Link>
                  <button onClick={() => setSubmitted(false)} className="rounded-xl px-5 py-2.5 text-sm font-semibold text-amber-800 hover:bg-amber-100 min-h-[44px]">
                    Retake the check
                  </button>
                </div>
              </div>
            )}
          </div>
          <p className="text-xs text-ink-500">
            This is a self-screen based on India's NACO donor guidelines, not medical
            advice. The blood bank's medical officer makes the final call.
          </p>
        </div>
      )}

      {/* Blood-bank deferral log: if a bank turned you away (low haemoglobin,
          recent tattoo, illness…), record it so the network stops counting you
          as ready until the deferral lifts. Mirrors e-RaktKosh's practice of
          blocking donors based on health and donation history. */}
      <section aria-label="Log a blood-bank deferral" className="mt-8 rounded-2xl border border-ink-200 bg-white p-5">
        <h2 className="text-sm font-bold text-ink-900">Were you deferred at a blood bank?</h2>
        <p className="mt-1 text-xs text-ink-500">
          Banks defer donors for health reasons — low haemoglobin, a recent tattoo or
          surgery, an illness. Logging it here keeps you out of emergency matches
          until you're cleared, automatically.
        </p>
        {myDeferral ? (
          <div className="mt-4 rounded-xl bg-amber-50 p-4 ring-1 ring-inset ring-amber-200">
            <p className="text-sm font-semibold text-amber-900">
              Deferred until {formatDate(myDeferral.deferredUntil)}
            </p>
            <p className="mt-0.5 text-xs text-amber-800">{myDeferral.reason}</p>
            <button
              onClick={() => removeDeferral(myDeferral.id)}
              className="mt-2 text-xs font-semibold text-amber-900 underline-offset-2 hover:underline min-h-[44px]"
            >
              Cleared early — remove this deferral
            </button>
          </div>
        ) : deferSaved ? (
          <p role="status" className="mt-4 rounded-xl bg-green-50 p-4 text-sm font-medium text-green-900 ring-1 ring-inset ring-green-200">
            Deferral logged. You'll sit out of emergency matches until it's cleared —
            your "My donations" page will show the date.
          </p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-ink-700">Reason for deferral</span>
              <input
                type="text"
                value={deferReason}
                onChange={(e) => setDeferReason(e.target.value)}
                placeholder="e.g. Low haemoglobin (10.8 g/dL)"
                className="w-full rounded-xl border border-ink-300 bg-white px-3.5 py-2.5 text-sm min-h-[44px]"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-ink-700">Deferred until</span>
              <input
                type="date"
                value={deferUntil}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDeferUntil(e.target.value)}
                className="rounded-xl border border-ink-300 bg-white px-3.5 py-2.5 text-sm min-h-[44px]"
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
              className="rounded-xl bg-ink-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-ink-800 disabled:cursor-not-allowed disabled:bg-ink-300 sm:col-span-2"
            >
              Log this deferral
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
