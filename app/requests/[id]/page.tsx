"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useDonors, useRequests, useDeferrals, useDonations, uid } from "@/lib/store";
import {
  COMPATIBLE_DONORS,
  activeDeferralFor,
  componentLabel,
  formatDate,
  formatDateTime,
  isComponentUrgent,
  isDeferred,
  isEffectivelyAvailable,
  isEligibleByInterval,
  isRare,
  nextEligibleDate,
  timeAgo,
  timeUntil,
} from "@/lib/blood";
import { EmptyState, Field, GroupBadge, PageHeader, UrgencyBadge, inputCls } from "@/components/ui";

function telHref(phone: string) {
  return `tel:${phone.replace(/[\s-]/g, "")}`;
}

export default function RequestDetail() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";
  const [donors, , , updateDonor] = useDonors();
  const [requests, , , updateRequest] = useRequests();
  const [deferrals] = useDeferrals();
  const [, , addDonation] = useDonations();
  const [pledgeName, setPledgeName] = useState("");
  const [pledgePhone, setPledgePhone] = useState("");
  const [pledgeUnits, setPledgeUnits] = useState(1);

  const request = requests.find((r) => r.id === id);

  // Auto-expire stale requests when viewed
  useEffect(() => {
    if (request && request.status === "open" && new Date(request.expiresAt) <= new Date()) {
      updateRequest(request.id, { status: "expired" });
    }
  }, [request, updateRequest]);

  const matches = useMemo(() => {
    if (!request) return [];
    const compatible = COMPATIBLE_DONORS[request.group];
    return donors
      .filter((d) => compatible.includes(d.group))
      .map((d) => {
        const eligible = isEligibleByInterval(d.lastDonation);
        const sameArea = d.area.trim().toLowerCase() === request.area.trim().toLowerCase();
        const active = isEffectivelyAvailable(d);
        // A deferred donor must never be the first call a family makes.
        const deferral = activeDeferralFor(deferrals, d.id);
        // Component requests need component donors: an apheresis-open donor
        // is worth spotlighting for platelet/plasma requests.
        const apheresisReady =
          !!d.openToApheresis &&
          (request.component === "platelets" || request.component === "plasma");
        const rareMatch =
          !!request.rarePhenotypeNeeded &&
          !!d.rarePhenotype &&
          d.rarePhenotype.trim().toLowerCase() === request.rarePhenotypeNeeded.trim().toLowerCase();
        const score =
          (active ? 4 : 0) +
          (eligible ? 2 : 0) +
          (sameArea ? 2 : 0) +
          (isRare(d.group) ? 1 : 0) +
          (rareMatch ? 6 : 0) +
          (apheresisReady ? 4 : 0) -
          (deferral ? 20 : 0);
        return { donor: d, eligible, sameArea, rareMatch, deferral, apheresisReady, score, next: nextEligibleDate(d.lastDonation) };
      })
      .sort((a, b) => b.score - a.score || b.donor.donations - a.donor.donations);
  }, [donors, deferrals, request]);

  const callable = matches.filter(
    (m) => isEffectivelyAvailable(m.donor) && m.eligible && !isDeferred(deferrals, m.donor.id)
  );

  // Duplicate detection: same group + same hospital posted within 24h — a
  // second family member often re-posts the same emergency. Offer a merge.
  const possibleDuplicate = useMemo(() => {
    if (!request) return null;
    const norm = (h: string) => h.trim().toLowerCase().replace(/\s+/g, " ");
    const mine = +new Date(request.createdAt);
    return (
      requests.find((r) => {
        if (r.id === request.id || r.status !== "open") return false;
        if (r.group !== request.group) return false;
        if (norm(r.hospital) !== norm(request.hospital)) return false;
        if (Math.abs(mine - +new Date(r.createdAt)) > 24 * 3600_000) return false;
        return +new Date(r.createdAt) < mine;
      }) ?? null
    );
  }, [requests, request]);

  // Pre-filled WhatsApp forward: families find donors through group chats,
  // so one tap should produce the message they'd otherwise type by hand.
  const shareText = useMemo(() => {
    if (!request) return "";
    const head =
      request.urgency === "critical"
        ? "URGENT — Blood needed"
        : request.urgency === "urgent"
          ? "Blood needed"
          : "Blood donation request";
    const lines = [
      `🩸 ${head}: ${request.units} unit${request.units > 1 ? "s" : ""} of ${request.group}`,
      ...(request.rarePhenotypeNeeded ? [`Rare phenotype needed: ${request.rarePhenotypeNeeded}`] : []),
      `Patient: ${request.patientName}`,
      `Hospital: ${request.hospital}, ${request.area}`,
      `Contact: ${request.contactName} — ${request.contactPhone}`,
      `Valid till: ${formatDateTime(request.expiresAt)}`,
      "Please forward to donors who can help.",
    ];
    return lines.join("\n");
  }, [request]);

  const shareHref = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  if (!request) {
    return (
      <EmptyState
        kind="search"
        title="Request not found"
        body="This request may have been removed, or the link is wrong."
        action={<Link href="/requests" className="rounded-xl bg-crimson-600 px-5 py-2.5 text-sm font-semibold text-white">Back to requests</Link>}
      />
    );
  }

  const expired = request.status === "expired" || new Date(request.expiresAt) <= new Date();

  const pledges = request.pledges ?? [];
  const pledgedUnits = pledges.reduce((s, p) => s + p.units, 0);
  const pledgePct = Math.min(100, Math.round((pledgedUnits / Math.max(1, request.units)) * 100));

  const addPledge = (e: React.FormEvent) => {
    e.preventDefault();
    const nm = pledgeName.trim();
    if (!nm) return;
    updateRequest(request.id, {
      pledges: [
        ...pledges,
        { id: uid("plg"), donorName: nm, phone: pledgePhone.trim(), units: Math.max(1, pledgeUnits), createdAt: new Date().toISOString() },
      ],
    });
    setPledgeName("");
    setPledgePhone("");
    setPledgeUnits(1);
  };

  // --- Fulfilled-request loop closure ---
  // A fulfilled request shouldn't leave its donors' histories frozen: the
  // family confirms who actually donated, and each matched registered donor
  // gets a real donation record plus updated lifetime count and
  // next-eligible date. Pledges already recorded are never counted twice.
  const last10 = (p: string) => p.replace(/\D/g, "").slice(-10);
  const matchDonor = (pledgeName: string, pledgePhone: string) => {
    const digits = last10(pledgePhone);
    if (digits) {
      const byPhone = donors.find((d) => last10(d.phone) === digits);
      if (byPhone) return byPhone;
    }
    const nm = pledgeName.trim().toLowerCase();
    if (nm) {
      const byName = donors.find((d) => d.name.trim().toLowerCase() === nm);
      if (byName) return byName;
    }
    return null;
  };
  const unrecordedPledges = (request?.pledges ?? []).filter((p) => !p.recorded);
  const [recordIds, setRecordIds] = useState<string[]>([]);
  const recordDonations = () => {
    if (!request || recordIds.length === 0) return;
    const today = new Date().toISOString().slice(0, 10);
    const updated = (request.pledges ?? []).map((p) => {
      if (!recordIds.includes(p.id)) return p;
      const donor = matchDonor(p.donorName, p.phone);
      if (donor) {
        addDonation({
          id: uid("dr"),
          donorId: donor.id,
          date: today,
          units: Math.max(1, p.units),
          location: request.hospital,
          journey: 0,
        });
        updateDonor(donor.id, {
          donations: donor.donations + Math.max(1, p.units),
          lastDonation:
            !donor.lastDonation || donor.lastDonation < today ? today : donor.lastDonation,
        });
      }
      return { ...p, recorded: true };
    });
    updateRequest(request.id, { pledges: updated });
    setRecordIds([]);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title={`Request for ${request.patientName}`} subtitle={`${request.units} unit${request.units > 1 ? "s" : ""} of ${request.group} ${componentLabel(request.component)} · ${request.hospital}, ${request.area}`} />

      <section className="rounded-2xl border border-ink-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <GroupBadge group={request.group} />
          <UrgencyBadge urgency={request.urgency} />
          {request.component && request.component !== "whole" && (
            <span className="rounded-md bg-ink-100 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-ink-800">
              {componentLabel(request.component)}
            </span>
          )}
          {isComponentUrgent(request.component) && request.status === "open" && (
            <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-amber-900 ring-1 ring-inset ring-amber-300" title="Platelets can't be stored — they must reach a patient within days.">
              Time-critical
            </span>
          )}
          {request.rarePhenotypeNeeded && (
            <span className="rounded-md bg-purple-100 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-purple-800">
              Needs {request.rarePhenotypeNeeded}
            </span>
          )}
          <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${request.status === "open" && !expired ? "bg-green-100 text-green-900" : "bg-ink-100 text-ink-600"}`}>
            {request.status === "fulfilled" ? "Fulfilled" : expired ? "Expired" : "Open"}
          </span>
        </div>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">Contact</dt><dd className="mt-0.5 font-medium text-ink-900">{request.contactName}</dd></div>
          <div><dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">Phone</dt><dd className="mt-0.5"><a href={telHref(request.contactPhone)} className="font-semibold text-crimson-700 hover:underline tnum">{request.contactPhone}</a></dd></div>
          <div><dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">Posted</dt><dd className="mt-0.5 text-ink-700">{timeAgo(request.createdAt)}</dd></div>
          <div><dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">{expired ? "Expired" : "Expires"}</dt><dd className="mt-0.5 text-ink-700">{formatDateTime(request.expiresAt)}{!expired && (() => { const u = timeUntil(request.expiresAt); return <span className={u.urgent ? "font-semibold text-crimson-700" : ""}> · {u.text}</span>; })()}</dd></div>
        </dl>
        {request.notes && <p className="mt-4 rounded-xl bg-ink-50 px-4 py-3 text-sm text-ink-700">{request.notes}</p>}
        {request.status === "open" && !expired && (
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <button
              onClick={() => { updateRequest(request.id, { status: "fulfilled" }); router.push("/requests"); }}
              className="rounded-xl bg-green-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-800 min-h-[44px]"
            >
              Mark as fulfilled
            </button>
            <button
              onClick={() => { updateRequest(request.id, { status: "expired" }); router.push("/requests"); }}
              className="rounded-xl border border-ink-300 px-5 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-50 min-h-[44px]"
            >
              Close request
            </button>
            <a
              href={shareHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-crimson-300 bg-crimson-50 px-5 py-2.5 text-sm font-semibold text-crimson-700 hover:bg-crimson-100 min-h-[44px] inline-flex items-center justify-center"
            >
              Share on WhatsApp
            </a>
            <Link
              href={`/requests/${request.id}/sos`}
              className="rounded-xl bg-crimson-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-crimson-700 min-h-[44px] inline-flex items-center justify-center"
            >
              SOS broadcast
            </Link>
            <Link
              href={`/requests/${request.id}/print`}
              className="rounded-xl border border-ink-300 px-5 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-50 min-h-[44px] inline-flex items-center justify-center"
              title="A one-page poster for the hospital noticeboard"
            >
              Print flyer
            </Link>
            <button
              onClick={() => {
                updateRequest(request.id, {
                  expiresAt: new Date(new Date(request.expiresAt).getTime() + 24 * 3600_000).toISOString(),
                });
              }}
              className="rounded-xl border border-ink-300 px-5 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-50 min-h-[44px]"
              title="Push the expiry 24 hours forward — the search stays live while pledges come in."
            >
              Extend by 24h
            </button>
          </div>
        )}
        {request.status === "expired" && (
          <div className="mt-5">
            <button
              onClick={() => {
                // Pre-fill the request form via the draft autosave key (cycle 22);
                // the form restores it on mount with its "draft restored" notice.
                try {
                  window.localStorage.setItem(
                    "raktha.request.draft.v1",
                    JSON.stringify({
                      patientName: request.patientName,
                      group: request.group,
                      units: request.units,
                      component: request.component ?? "whole",
                      hospital: request.hospital,
                      area: request.area,
                      contactName: request.contactName,
                      contactPhone: request.contactPhone,
                      urgency: request.urgency,
                      notes: request.notes,
                    })
                  );
                } catch {
                  // storage unavailable — the form still works, just not pre-filled
                }
                router.push("/request");
              }}
              className="rounded-xl bg-crimson-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-crimson-700 min-h-[44px]"
            >
              Repost as new request
            </button>
            <p className="mt-2 text-xs text-ink-500">
              The emergency isn't over just because the timer ran out. The form comes back pre-filled with every detail — adjust anything and submit.
            </p>
          </div>
        )}
      </section>

      {possibleDuplicate && request.status === "open" && !expired && (
        <section role="alert" aria-label="Possible duplicate request" className="rounded-2xl border border-amber-300 bg-amber-50 p-5 sm:p-6">
          <h2 className="text-base font-bold text-amber-900">Possible duplicate request</h2>
          <p className="mt-1 text-sm text-amber-900">
            An earlier open request for {request.group} at {request.hospital} was posted{" "}
            {timeAgo(possibleDuplicate.createdAt)}. If this is the same emergency, close this
            one so donors aren't split across two threads.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/requests/${possibleDuplicate.id}`}
              className="rounded-xl border border-amber-700 px-5 py-2.5 text-sm font-semibold text-amber-900 hover:bg-amber-100 min-h-[44px] inline-flex items-center"
            >
              View the earlier request
            </Link>
            <button
              onClick={() => { updateRequest(request.id, { status: "expired" }); router.push("/requests"); }}
              className="rounded-xl bg-amber-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-800 min-h-[44px]"
            >
              Close as duplicate
            </button>
          </div>
        </section>
      )}

      <section aria-label="Pledged donations" className="rounded-2xl border border-ink-200 bg-white p-5 sm:p-6">
        {request.status === "open" && !expired && pledges.length === 0 &&
          Date.now() - +new Date(request.createdAt) > 6 * 3600_000 && (
            <div role="alert" className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-4 ring-1 ring-inset ring-amber-200">
              <p className="text-sm font-bold text-amber-900">
                No pledges yet after {timeAgo(request.createdAt)} — share again
              </p>
              <p className="mt-1 text-sm text-amber-900">
                A second forward reaches new people. The request that gets shared twice is the one that gets answered.
              </p>
              <a
                href={shareHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex min-h-[44px] items-center rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-700"
              >
                Re-share on WhatsApp
              </a>
            </div>
          )}
        {request.status === "open" && !expired && pledgedUnits >= request.units && (
          <div role="status" className="mb-5 flex items-start gap-3 rounded-2xl border border-green-300 bg-green-50 p-4">
            <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-600 text-base font-bold text-white">✓</span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-green-900">
                Pledge goal met — {pledgedUnits} of {request.units} unit{request.units > 1 ? "s" : ""} covered
              </p>
              <p className="mt-0.5 text-xs text-green-800">
                Families usually confirm the donations by phone, then mark the request fulfilled so donors stop getting called.
              </p>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-ink-900">Donation pledges</h2>
          <p className="tnum text-sm font-semibold text-ink-700">
            {pledgedUnits} / {request.units} units pledged
          </p>
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-ink-100" role="progressbar" aria-valuenow={pledgePct} aria-valuemin={0} aria-valuemax={100} aria-label={`${pledgedUnits} of ${request.units} units pledged`}>
          <div className={`h-full rounded-full ${pledgedUnits >= request.units ? "bg-green-600" : "bg-crimson-600"}`} style={{ width: `${pledgePct}%` }} />
        </div>
        {pledges.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {pledges.map((p) => (
              <li key={p.id} className="flex items-center gap-3 rounded-xl bg-ink-50 px-4 py-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-xs font-bold text-crimson-700 tnum ring-1 ring-ink-200" aria-hidden="true">
                  {p.units}u
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-900">{p.donorName}</p>
                  <p className="text-xs text-ink-500">{timeAgo(p.createdAt)}</p>
                </div>
                {p.phone && (
                  <a href={telHref(p.phone)} className="rounded-lg bg-crimson-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-crimson-700 min-h-[44px] inline-flex items-center">
                    Call
                  </a>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-ink-500">
            Nobody has pledged yet. A pledge is a promise to donate — families can see at a glance whether the gap is closing.
          </p>
        )}
        {request.status === "fulfilled" && unrecordedPledges.length > 0 && (
          <div className="mt-4 rounded-xl border border-green-300 bg-green-50 p-4">
            <p className="text-sm font-bold text-green-900">Record the donations</p>
            <p className="mt-1 text-xs text-green-800">
              Tick everyone who actually donated. Matched registered donors get the donation in
              their history — lifetime count, last-donation date, and next-eligible countdown
              all update automatically.
            </p>
            <ul className="mt-3 space-y-2">
              {unrecordedPledges.map((p) => {
                const donor = matchDonor(p.donorName, p.phone);
                const checked = recordIds.includes(p.id);
                return (
                  <li key={p.id} className="flex items-center gap-3 rounded-xl bg-white px-4 py-2.5 ring-1 ring-green-200">
                    <input
                      type="checkbox"
                      id={`rec-${p.id}`}
                      checked={checked}
                      onChange={(e) =>
                        setRecordIds((prev) =>
                          e.target.checked ? [...prev, p.id] : prev.filter((x) => x !== p.id)
                        )
                      }
                      className="h-5 w-5 shrink-0 accent-green-700"
                    />
                    <div className="min-w-0 flex-1">
                      <label htmlFor={`rec-${p.id}`} className="block cursor-pointer truncate text-sm font-semibold text-ink-900">
                        {p.donorName} <span className="tnum font-medium text-ink-500">· {p.units}u</span>
                      </label>
                      <p className="text-xs text-ink-500">
                        {donor ? (
                          <span className="font-semibold text-green-800">Registered donor — history will update</span>
                        ) : (
                          "Not on the registry — will just close out the request"
                        )}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
            <button
              onClick={recordDonations}
              disabled={recordIds.length === 0}
              className="mt-3 rounded-xl bg-green-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-800 min-h-[44px] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Record {recordIds.length > 0 ? `${recordIds.length} ` : ""}donation{recordIds.length === 1 ? "" : "s"}
            </button>
          </div>
        )}
        {request.status === "open" && !expired && (
          <form onSubmit={addPledge} className="mt-4 grid gap-3 border-t border-ink-100 pt-4 sm:grid-cols-[1fr_1fr_110px_auto]">
            <Field label="Your name">
              <input value={pledgeName} onChange={(e) => setPledgeName(e.target.value)} required maxLength={60} placeholder="e.g. Karthik Raja" className={inputCls} />
            </Field>
            <Field label="Phone (optional)">
              <input value={pledgePhone} onChange={(e) => setPledgePhone(e.target.value)} maxLength={20} placeholder="+91 ..." className={inputCls} />
            </Field>
            <Field label="Units">
              <input type="number" min={1} max={4} value={pledgeUnits} onChange={(e) => setPledgeUnits(Number(e.target.value))} aria-label="Pledged units" className={inputCls} />
            </Field>
            <div className="flex items-end">
              <button type="submit" className="w-full rounded-xl bg-crimson-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-crimson-700 min-h-[44px] sm:w-auto">
                Pledge
              </button>
            </div>
          </form>
        )}
      </section>

      <section aria-label="Matching donors">
        <h2 className="mb-3 text-base font-bold text-ink-900">
          Compatible donors <span className="tnum font-semibold text-ink-500">({callable.length} ready to call)</span>
        </h2>
        {callable.length === 0 ? (
          <EmptyState
            kind="people"
            title="No ready donors match right now"
            body={`Nobody registered can donate ${request.group} at the moment. Try widening the net: share the request, or check the blood bank stock below — O- donors can cover any group.`}
            action={<Link href="/banks" className="rounded-xl border border-ink-300 px-5 py-2.5 text-sm font-semibold text-ink-800 hover:bg-ink-50">Check blood banks</Link>}
          />
        ) : (
          <ul className="space-y-3">
            {matches.map(({ donor, eligible, sameArea, rareMatch, deferral, apheresisReady, next }) => {
              const ready = isEffectivelyAvailable(donor) && eligible && !deferral;
              return (
                <li key={donor.id} className={`flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 ${ready ? "border-ink-200" : "border-ink-200 opacity-70"}`}>
                  <GroupBadge group={donor.group} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-900">
                      {donor.name}
                      {sameArea && <span className="ml-2 rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-green-800">nearby</span>}
                      {rareMatch && <span className="ml-2 rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-purple-800" title={`Rare phenotype match: ${donor.rarePhenotype}`}>rare match</span>}
                      {apheresisReady && <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-900" title="Open to platelet/plasma donation (apheresis)">apheresis-ready</span>}
                    </p>
                    <p className="text-xs text-ink-500">
                      {donor.area} · {donor.donations} donation{donor.donations === 1 ? "" : "s"}
                      {deferral ? (
                        <span className="font-semibold text-amber-800">
                          {` · deferred until ${formatDate(deferral.deferredUntil)}`}
                        </span>
                      ) : (
                        <>
                          {!eligible && next ? ` · eligible ${next.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : ""}
                          {!isEffectivelyAvailable(donor) ? " · paused" : ""}
                        </>
                      )}
                    </p>
                  </div>
                  {ready ? (
                    <a href={telHref(donor.phone)} className="rounded-lg bg-crimson-600 px-4 py-2 text-sm font-semibold text-white hover:bg-crimson-700 min-h-[44px] inline-flex items-center">
                      Call
                    </a>
                  ) : (
                    <span className="rounded-lg bg-ink-100 px-4 py-2 text-xs font-semibold text-ink-500">Not available</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-3 text-xs text-ink-500">
          Matches use the red-cell transfusion compatibility matrix. Donors are ranked by
          availability, 90-day eligibility, proximity, and rarity. Rare-group donors
          (O−, A−, B−, AB−) are flagged because they're hardest to find.
        </p>
      </section>
    </div>
  );
}
