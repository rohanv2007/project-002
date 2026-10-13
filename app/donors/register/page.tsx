"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDonors, uid } from "@/lib/store";
import { BLOOD_GROUPS, RARE_PHENOTYPES, isValidIndianMobile, normalizeIndianPhone } from "@/lib/blood";
import { Field, PageHeader, inputCls } from "@/components/ui";
import type { BloodGroup } from "@/lib/types";

export default function RegisterDonor() {
  const router = useRouter();
  const [donors, , addDonor] = useDonors();
  const [name, setName] = useState("");
  const [group, setGroup] = useState<BloodGroup>("O+");
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState("");
  const [lastDonation, setLastDonation] = useState("");
  const [available, setAvailable] = useState(true);
  const [rarePhenotype, setRarePhenotype] = useState("");
  const [openToApheresis, setOpenToApheresis] = useState(false);
  const [error, setError] = useState("");

  // Warn when the number is already on the registry (non-blocking: families share phones).
  const duplicate = useMemo(() => {
    const digits = phone.replace(/\D/g, "").slice(-10);
    if (digits.length < 10) return null;
    return donors.find((d) => d.phone.replace(/\D/g, "").slice(-10) === digits) ?? null;
  }, [phone, donors]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return setError("Please enter your full name.");
    if (!isValidIndianMobile(phone)) return setError("Please enter a valid 10-digit Indian mobile number (starting 6–9).");
    if (area.trim().length < 2) return setError("Please enter your area or locality.");
    setError("");
    addDonor({
      id: uid("donor"),
      name: name.trim(),
      group,
      phone: normalizeIndianPhone(phone),
      area: area.trim(),
      available,
      lastDonation: lastDonation || null,
      donations: 0,
      rarePhenotype: rarePhenotype || null,
      openToApheresis,
      createdAt: new Date().toISOString(),
    });
    router.push("/donors?registered=1");
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Register as a donor"
        subtitle="One registration puts you on the map for every emergency request near you. You control your availability — pause anytime."
      />
      <form onSubmit={submit} className="space-y-5 rounded-[4px] border border-line bg-cream p-5 sm:p-8">
        {error && (
          <p role="alert" className="rounded-[3px] bg-cream px-4 py-3 text-sm font-medium text-ember ring-1 ring-inset ring-signal">
            {error}
          </p>
        )}
        {duplicate && (
          <p role="status" className="rounded-[3px] bg-cream px-4 py-3 text-sm text-gold ring-1 ring-inset ring-line">
            This number is already registered for <span className="font-semibold">{duplicate.name}</span> ({duplicate.group}, {duplicate.area}).{" "}
            <Link href="/donors" className="font-semibold underline">View in directory</Link> instead of registering again.
          </p>
        )}
        <Field label="Full name">
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Arun Kumar" autoComplete="name" />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Blood group">
            <select className={inputCls} value={group} onChange={(e) => setGroup(e.target.value as BloodGroup)}>
              {BLOOD_GROUPS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </Field>
          <Field label="Phone number" hint="Only shared with requesters you match — never published.">
            <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 …" inputMode="tel" autoComplete="tel" />
          </Field>
        </div>
        <Field label="Area / locality">
          <input className={inputCls} value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. Thandalam, Poonamallee" />
        </Field>
        <Field label="Last blood donation (optional)" hint="Used to compute your next eligible date. Leave blank if you've never donated.">
          <input type="date" className={inputCls} value={lastDonation} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setLastDonation(e.target.value)} />
        </Field>
        <Field label="Rare phenotype (optional)" hint="Only if a lab told you — e.g. Bombay (Oh). Feeds the rare-donor spotlight, like the national ICMR-NIIH registry.">
          <select className={inputCls} value={rarePhenotype} onChange={(e) => setRarePhenotype(e.target.value)}>
            <option value="">None that I know of</option>
            {RARE_PHENOTYPES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </Field>
        <label className="flex cursor-pointer items-start gap-3 rounded-[3px] bg-paper px-4 py-3">
          <input
            type="checkbox"
            checked={available}
            onChange={(e) => setAvailable(e.target.checked)}
            className="mt-1 h-5 w-5 rounded accent-[#c93e1c]"
          />
          <span>
            <span className="block text-sm font-medium text-ink">I'm available for emergency calls</span>
            <span className="block text-xs text-faint">Turn this off anytime — you won't appear in emergency matches while paused.</span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 rounded-[3px] bg-paper px-4 py-3">
          <input
            type="checkbox"
            checked={openToApheresis}
            onChange={(e) => setOpenToApheresis(e.target.checked)}
            className="mt-1 h-5 w-5 rounded accent-[#c93e1c]"
          />
          <span>
            <span className="block text-sm font-medium text-ink">I'm open to platelet / plasma donation</span>
            <span className="block text-xs text-faint">Apheresis at the blood bank (60–90 min). You'll be spotlighted when a request needs platelets or plasma.</span>
          </span>
        </label>
        <button type="submit" className="w-full rounded-[3px] bg-signal px-6 py-3.5 text-sm font-semibold text-cream hover:bg-ember">
          Register donor
        </button>
        <p className="text-center text-xs text-faint">
          Not sure you can donate? <a href="/eligibility" className="font-semibold text-signal hover:underline">Take the 2-minute eligibility check</a> first.
        </p>
      </form>
    </div>
  );
}
