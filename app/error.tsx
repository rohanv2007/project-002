"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Last-resort safety net: if a page crashes, show a calm, human message —
 * never a blank screen in the middle of an emergency.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Logged for diagnosis; nothing leaves the browser.
    console.error("Raktha page error:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="text-5xl" aria-hidden="true">
        🩸
      </p>
      <h1 className="mt-4 text-xl font-bold text-ink-900">Something went wrong on this page</h1>
      <p className="mt-2 text-sm text-ink-600">
        Your saved donors, requests and banks are safe in this browser — this is a
        display hiccup, not lost data.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <button
          onClick={reset}
          className="rounded-xl bg-crimson-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-crimson-700 min-h-[44px]"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-xl border border-ink-300 px-5 py-2.5 text-sm font-semibold text-ink-800 hover:bg-ink-50 min-h-[44px] inline-flex items-center"
        >
          Go home
        </Link>
      </div>
      {error.digest && (
        <p className="tnum mt-6 text-[11px] text-ink-400">Error ref: {error.digest}</p>
      )}
    </div>
  );
}
