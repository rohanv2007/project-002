"use client";

import { useState } from "react";
import { seedBanks, seedCamps, seedDonors, seedRequests, seedTeams } from "@/lib/seed";
import { PageHeader } from "@/components/ui";

const DATA_KEYS = [
  "raktha.donors.v1",
  "raktha.requests.v1",
  "raktha.banks.v1",
  "raktha.donations.v1",
  "raktha.teams.v1",
  "raktha.reminders.v1",
  "raktha.camps.v1",
  "raktha.pledges.v1",
  "raktha.watches.v1",
  "raktha.patients.v1",
  "raktha.deferrals.v1",
  "raktha.appointments.v1",
  "raktha.seeded.v1",
] as const;

function readKey(key: string): unknown {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function Settings() {
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmReseed, setConfirmReseed] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const exportAll = () => {
    const data: Record<string, unknown> = {};
    for (const k of DATA_KEYS) data[k] = readKey(k);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `raktha-data-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reseed = () => {
    try {
      window.localStorage.setItem("raktha.donors.v1", JSON.stringify(seedDonors()));
      window.localStorage.setItem("raktha.requests.v1", JSON.stringify(seedRequests()));
      window.localStorage.setItem("raktha.banks.v1", JSON.stringify(seedBanks()));
      window.localStorage.setItem("raktha.donations.v1", JSON.stringify([]));
      window.localStorage.setItem("raktha.teams.v1", JSON.stringify(seedTeams()));
      window.localStorage.setItem("raktha.camps.v1", JSON.stringify(seedCamps()));
      window.localStorage.setItem("raktha.seeded.v1", "true");
    } catch {
      /* storage unavailable — nothing to do */
    }
    window.location.reload();
  };

  const resetAll = () => {
    try {
      for (const k of DATA_KEYS) window.localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
    window.location.reload();
  };

  /**
   * Restore from an exported JSON file — moving phones or recovering after a
   * browser-data wipe. Validates the shape first; unknown keys are ignored.
   */
  const importFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result)) as unknown;
        if (!data || typeof data !== "object" || Array.isArray(data)) {
          throw new Error("this doesn't look like a Raktha export");
        }
        const imported: string[] = [];
        for (const k of DATA_KEYS) {
          const v = (data as Record<string, unknown>)[k];
          if (v === undefined || v === null) continue;
          if (!Array.isArray(v)) throw new Error(`"${k}" is not a list — file rejected`);
          window.localStorage.setItem(k, JSON.stringify(v));
          imported.push(`${k.replace("raktha.", "").replace(".v1", "")} (${v.length})`);
        }
        if (imported.length === 0) throw new Error("no Raktha data found in this file");
        setImportResult(`Imported ${imported.join(", ")} — reloading…`);
        setImportError(null);
        setTimeout(() => window.location.reload(), 1200);
      } catch (e) {
        setImportError(e instanceof Error ? `Couldn't import: ${e.message}.` : "Couldn't import this file.");
        setImportResult(null);
      }
    };
    reader.onerror = () => {
      setImportError("Couldn't read that file.");
      setImportResult(null);
    };
    reader.readAsText(file);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Your data, your browser, your call."
      />

      <section aria-label="Data controls" className="rounded-2xl border border-ink-200 bg-white p-5 sm:p-6">
        <h2 className="text-base font-bold text-ink-900">Data controls</h2>
        <p className="mt-1 text-sm text-ink-600">
          Raktha is local-first: donors, requests, and banks live only in this browser's storage.
        </p>

        <div className="mt-5 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-ink-900">Export everything</p>
              <p className="text-xs text-ink-500">Download all your Raktha data as one JSON file.</p>
            </div>
            <button
              onClick={exportAll}
              className="rounded-xl border border-ink-300 px-5 py-2.5 text-sm font-semibold text-ink-800 hover:bg-ink-50 min-h-[44px]"
            >
              Export JSON
            </button>
          </div>

          <div className="border-t border-ink-100 pt-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-ink-900">Import backup</p>
                <p className="text-xs text-ink-500">Restore from a Raktha export file — new phone, or after a browser-data wipe.</p>
              </div>
              <label className="inline-flex min-h-[44px] cursor-pointer items-center rounded-xl border border-ink-300 px-5 py-2.5 text-sm font-semibold text-ink-800 hover:bg-ink-50">
                Choose file
                <input
                  type="file"
                  accept="application/json,.json"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) importFile(f);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
            {importResult && (
              <p role="status" className="mt-3 rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-900 ring-1 ring-inset ring-green-200">
                {importResult}
              </p>
            )}
            {importError && (
              <p role="alert" className="mt-3 rounded-xl bg-crimson-50 px-4 py-3 text-sm font-medium text-crimson-800 ring-1 ring-inset ring-crimson-200">
                {importError}
              </p>
            )}
          </div>

          <div className="border-t border-ink-100 pt-4">
            {confirmReseed ? (
              <div className="rounded-xl bg-amber-50 p-4 ring-1 ring-inset ring-amber-200">
                <p className="text-sm font-semibold text-amber-900">
                  Replace everything with fresh demo data?
                </p>
                <p className="mt-1 text-xs text-amber-800">
                  Your current donors, requests, and donations will be overwritten.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={reseed} className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 min-h-[44px]">
                    Yes, reload demo data
                  </button>
                  <button onClick={() => setConfirmReseed(false)} className="rounded-xl border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100 min-h-[44px]">
                    Keep my data
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-ink-900">Reload demo data</p>
                  <p className="text-xs text-ink-500">Start over with the original sample donors, requests, and camps.</p>
                </div>
                <button
                  onClick={() => setConfirmReseed(true)}
                  className="rounded-xl border border-ink-300 px-5 py-2.5 text-sm font-semibold text-ink-800 hover:bg-ink-50 min-h-[44px]"
                >
                  Reload demo data
                </button>
              </div>
            )}
          </div>

          <div className="border-t border-ink-100 pt-4">
            {confirmReset ? (
              <div className="rounded-xl bg-crimson-50 p-4 ring-1 ring-inset ring-crimson-200">
                <p className="text-sm font-semibold text-crimson-900">
                  Delete ALL Raktha data from this browser?
                </p>
                <p className="mt-1 text-xs text-crimson-800">
                  This cannot be undone. Export first if you want a copy.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={resetAll} className="rounded-xl bg-crimson-600 px-4 py-2 text-sm font-semibold text-white hover:bg-crimson-700 min-h-[44px]">
                    Yes, delete everything
                  </button>
                  <button onClick={() => setConfirmReset(false)} className="rounded-xl border border-crimson-300 px-4 py-2 text-sm font-semibold text-crimson-900 hover:bg-crimson-100 min-h-[44px]">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-ink-900">Reset all data</p>
                  <p className="text-xs text-ink-500">Wipe donors, requests, donations, reminders, and everything else.</p>
                </div>
                <button
                  onClick={() => setConfirmReset(true)}
                  className="rounded-xl border border-crimson-300 px-5 py-2.5 text-sm font-semibold text-crimson-700 hover:bg-crimson-50 min-h-[44px]"
                >
                  Reset all data
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <section aria-label="Privacy" className="rounded-2xl border border-ink-200 bg-white p-5 sm:p-6">
        <h2 className="text-base font-bold text-ink-900">Privacy</h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-ink-600">
          <li>No account, no sign-in, no server — everything stays in this browser.</li>
          <li>Nothing is uploaded, tracked, or shared unless you tap Share or Copy.</li>
          <li>Clearing this site's browser data removes all Raktha data with it.</li>
        </ul>
      </section>

      <section aria-label="About" className="rounded-2xl border border-ink-200 bg-white p-5 sm:p-6">
        <h2 className="text-base font-bold text-ink-900">About</h2>
        <p className="mt-2 text-sm text-ink-600">
          <strong className="text-ink-900">Project 002 · Raktha — Emergency Blood Donor Network.</strong>{" "}
          A calm, fast, local-first network: register donors once, screen eligibility honestly,
          post a request in under a minute, and call the right donors before it's too late.
        </p>
      </section>
    </div>
  );
}
