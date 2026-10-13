"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useRequests } from "@/lib/store";
import { formatDateTime } from "@/lib/blood";
import { EmptyState, GroupBadge, PageHeader, UrgencyBadge } from "@/components/ui";
import { buildCallScript, buildSosText, smsHref, whatsappHref } from "@/lib/share";

/**
 * SOS broadcast studio: one message, three channels (WhatsApp / SMS /
 * clipboard), plus a phone script for calling matched donors. The message
 * is generated from live request data — pledge counts included — so the
 * family never hand-types the emergency forward.
 */
export default function SosStudio() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [requests] = useRequests();
  const [copied, setCopied] = useState(false);
  const [scriptCopied, setScriptCopied] = useState(false);

  const request = requests.find((r) => r.id === id);

  const { text, script } = useMemo(() => {
    if (!request) return { text: "", script: "" };
    const pledged = (request.pledges ?? []).reduce((s, p) => s + p.units, 0);
    return { text: buildSosText(request, pledged), script: buildCallScript(request) };
  }, [request]);

  const copyText = async (value: string, done: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Clipboard API blocked — fall back to a hidden textarea.
      const ta = document.createElement("textarea");
      ta.value = value;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        /* clipboard unavailable; leave the text selectable instead */
      }
      document.body.removeChild(ta);
    }
    done(true);
    window.setTimeout(() => done(false), 2000);
  };

  if (!request) {
    return (
      <EmptyState
        kind="search"
        title="Request not found"
        body="This request may have been removed, or the link is wrong."
        action={
          <Link href="/requests" className="rounded-xl bg-crimson-600 px-5 py-2.5 text-sm font-semibold text-white">
            Back to requests
          </Link>
        }
      />
    );
  }

  const expired = request.status !== "open" || new Date(request.expiresAt) <= new Date();

  return (
    <>
    <div className="mx-auto max-w-2xl space-y-6 print:hidden">
      <PageHeader
        title="SOS broadcast"
        subtitle={`The emergency forward for ${request.patientName}'s request — generated live, so pledge counts and expiry stay accurate.`}
      />

      <section className="rounded-2xl border border-ink-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <GroupBadge group={request.group} />
          <UrgencyBadge urgency={request.urgency} />
          <span
            className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
              expired ? "bg-ink-100 text-ink-600" : "bg-green-100 text-green-900"
            }`}
          >
            {expired ? "Closed" : "Live"}
          </span>
        </div>

        <h2 className="mt-4 text-sm font-bold text-ink-900">Message preview</h2>
        <pre className="mt-2 max-h-72 overflow-y-auto whitespace-pre-wrap rounded-xl bg-ink-50 p-4 text-sm leading-relaxed text-ink-800">
          {text}
        </pre>

        <h2 className="mt-5 text-sm font-bold text-ink-900">Send it</h2>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <a
            href={whatsappHref(text)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-crimson-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-crimson-700 min-h-[44px] inline-flex items-center justify-center"
          >
            WhatsApp
          </a>
          <a
            href={smsHref(text)}
            className="rounded-xl border border-ink-300 px-4 py-2.5 text-center text-sm font-semibold text-ink-800 hover:bg-ink-50 min-h-[44px] inline-flex items-center justify-center"
          >
            SMS
          </a>
          <button
            onClick={() => copyText(text, setCopied)}
            className="rounded-xl border border-ink-300 px-4 py-2.5 text-sm font-semibold text-ink-800 hover:bg-ink-50 min-h-[44px]"
            aria-live="polite"
          >
            {copied ? "✓ Copied" : "Copy message"}
          </button>
        </div>
        <p className="mt-2 text-xs text-ink-500">
          WhatsApp opens a pre-filled forward — drop it into every donor group you're in. SMS works when data doesn't.
        </p>
        <button
          onClick={() => window.print()}
          className="mt-3 w-full rounded-xl border border-ink-300 px-4 py-2.5 text-sm font-semibold text-ink-800 hover:bg-ink-50 min-h-[44px]"
        >
          Print emergency poster
        </button>
        <p className="mt-2 text-xs text-ink-500">
          A bold one-page poster for hospital notice boards and blood bank counters — for donors who never see the WhatsApp forward.
        </p>
      </section>

      <section className="rounded-2xl border border-ink-200 bg-white p-5 sm:p-6">
        <h2 className="text-sm font-bold text-ink-900">Phone script</h2>
        <p className="mt-1 text-xs text-ink-500">
          Calling matched donors one by one? Say this — it keeps every call consistent and calm.
        </p>
        <p className="mt-3 rounded-xl bg-ink-50 p-4 text-sm leading-relaxed text-ink-800">{script}</p>
        <button
          onClick={() => copyText(script, setScriptCopied)}
          className="mt-3 rounded-xl border border-ink-300 px-4 py-2 text-sm font-semibold text-ink-800 hover:bg-ink-50 min-h-[44px]"
          aria-live="polite"
        >
          {scriptCopied ? "✓ Copied" : "Copy script"}
        </button>
      </section>

      <Link
        href={`/requests/${request.id}`}
        className="inline-block rounded-xl border border-ink-300 px-5 py-2.5 text-sm font-semibold text-ink-800 hover:bg-ink-50 min-h-[44px]"
      >
        ← Back to request
      </Link>
    </div>
    {/* Print-only emergency poster: a bold one-page flyer for hospital notice
        boards and blood bank counters — a physical backup for donors the
        WhatsApp forward never reaches. High-contrast black on white. */}
    <div className="hidden print:block" aria-hidden="true">
      <div className="mx-auto max-w-xl border-4 border-black p-8">
        <p className="text-center text-sm font-black uppercase tracking-[0.2em]">
          {request.urgency === "critical" ? "Urgent — blood needed now" : "Blood donors needed"}
        </p>
        <p className="mt-6 text-center text-8xl font-black tracking-tight">{request.group}</p>
        <p className="mt-2 text-center text-3xl font-extrabold">
          {request.units} unit{request.units === 1 ? "" : "s"} needed
        </p>
        <p className="mt-2 text-center text-sm font-semibold">
          {(request.pledges ?? []).reduce((s, p) => s + p.units, 0)} unit{(request.pledges ?? []).reduce((s, p) => s + p.units, 0) === 1 ? "" : "s"} pledged so far
        </p>
        <dl className="mt-8 space-y-3 border-t-2 border-black pt-6 text-base">
          <div className="flex gap-4">
            <dt className="w-28 shrink-0 text-xs font-bold uppercase tracking-wide">Patient</dt>
            <dd className="font-bold">{request.patientName}</dd>
          </div>
          <div className="flex gap-4">
            <dt className="w-28 shrink-0 text-xs font-bold uppercase tracking-wide">Hospital</dt>
            <dd className="font-bold">{request.hospital}, {request.area}</dd>
          </div>
          <div className="flex gap-4">
            <dt className="w-28 shrink-0 text-xs font-bold uppercase tracking-wide">Contact</dt>
            <dd className="font-bold">{request.contactName} — {request.contactPhone}</dd>
          </div>
          <div className="flex gap-4">
            <dt className="w-28 shrink-0 text-xs font-bold uppercase tracking-wide">Needed by</dt>
            <dd className="font-bold">{formatDateTime(request.expiresAt)}</dd>
          </div>
        </dl>
        <p className="mt-8 border-t-2 border-black pt-4 text-center text-xs text-neutral-700">
          If your blood group matches, please call the number above. Shared via Raktha — Emergency Blood Donor Network.
        </p>
      </div>
    </div>
    </>
  );
}
