"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useRequests } from "@/lib/store";
import { componentLabel, formatDateTime } from "@/lib/blood";
import { GroupBadge } from "@/components/ui";

/**
 * Print-ready emergency flyer for a request: families pin these on hospital
 * noticeboards and share photos of them in group chats. Prints to one page.
 */
export default function RequestFlyer() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [requests] = useRequests();
  const request = requests.find((r) => r.id === id);

  if (!request) {
    return (
      <div className="mx-auto max-w-2xl py-10 text-center print:hidden">
        <p className="text-sm text-ink-600">Request not found.</p>
        <Link href="/requests" className="mt-4 inline-block text-sm font-semibold text-crimson-700 hover:underline">
          Back to requests
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Screen-only controls */}
      <div className="print:hidden">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link href={`/requests/${request.id}`} className="text-sm font-semibold text-crimson-700 hover:underline">
            ← Back to request
          </Link>
          <button
            onClick={() => window.print()}
            className="rounded-xl bg-crimson-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-crimson-700 min-h-[44px]"
          >
            Print flyer
          </button>
        </div>
        <p className="mb-4 text-sm text-ink-600">
          Flyer preview — pin it on the hospital noticeboard, or share a photo of the printout in group chats.
        </p>
      </div>

      {/* The flyer: shows on screen AND in print */}
      <div className="border-4 border-ink-900 bg-white p-8 text-center sm:p-10 print:border-4">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-crimson-700">
          {request.urgency === "critical" ? "Urgent — blood needed now" : "Blood donation appeal"}
        </p>
        <div className="mt-4 flex justify-center">
          <GroupBadge group={request.group} size="lg" />
        </div>
        <h1 className="mt-3 text-3xl font-black text-ink-900 sm:text-4xl">
          {request.units} unit{request.units > 1 ? "s" : ""} of {request.group} {componentLabel(request.component)}
        </h1>
        <p className="mt-2 text-lg font-semibold text-ink-800">for {request.patientName}</p>
        <div className="mx-auto mt-5 max-w-md space-y-2 rounded-2xl bg-ink-50 p-5 text-left">
          <p className="text-sm text-ink-700"><span className="font-bold text-ink-900">Hospital:</span> {request.hospital}</p>
          <p className="text-sm text-ink-700"><span className="font-bold text-ink-900">Area:</span> {request.area}</p>
          <p className="text-sm text-ink-700"><span className="font-bold text-ink-900">Contact:</span> {request.contactName}</p>
          <p className="text-2xl font-black tracking-wide text-ink-900 tnum">{request.contactPhone}</p>
          <p className="text-xs text-ink-500">Valid till {formatDateTime(request.expiresAt)}</p>
        </div>
        <p className="mt-5 text-sm font-medium text-ink-600">
          If your blood group can donate to {request.group}, please call. One call can save a life.
        </p>
        <p className="mt-4 text-xs font-bold uppercase tracking-[0.3em] text-ink-400">
          Raktha · Project 002
        </p>

        {/* Tear-off contact tabs: the classic noticeboard flyer trick — a
            passerby tears one strip off and keeps the number. Dashed borders
            act as cut guides on paper. */}
        <div className="mt-6 border-t-2 border-dashed border-ink-400 pt-4">
          <p className="text-xs font-semibold text-ink-500 print:text-ink-600">
            Tear off a strip and keep the number
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="min-w-0 flex-1 basis-24 border-2 border-dashed border-ink-500 bg-white px-2 py-3 text-center"
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-crimson-700">Blood needed</p>
                <p className="mt-1 text-xs font-black tracking-wide text-ink-900 tnum [writing-mode:vertical-rl] rotate-180 mx-auto w-fit sm:[writing-mode:horizontal-tb] sm:rotate-0">
                  {request.contactPhone}
                </p>
                <p className="mt-1 text-[10px] font-semibold text-ink-600">{request.group}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
