"use client";

import { useEffect } from "react";
import { isSeeded, markSeeded } from "@/lib/store";
import { seedBanks, seedCamps, seedDonors, seedRequests, seedTeams } from "@/lib/seed";

/**
 * Seeds demo data into localStorage on the very first visit.
 * Never overwrites user data afterwards.
 */
export default function SeedProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    try {
      if (!isSeeded()) {
        window.localStorage.setItem("raktha.donors.v1", JSON.stringify(seedDonors()));
        window.localStorage.setItem("raktha.requests.v1", JSON.stringify(seedRequests()));
        window.localStorage.setItem("raktha.banks.v1", JSON.stringify(seedBanks()));
        window.localStorage.setItem("raktha.donations.v1", JSON.stringify([]));
        window.localStorage.setItem("raktha.teams.v1", JSON.stringify(seedTeams()));
        markSeeded();
      }
      // Backfill: camps were introduced after launch — returning visitors
      // get the demo camps once, without touching their other data.
      if (!window.localStorage.getItem("raktha.camps.v1")) {
        window.localStorage.setItem("raktha.camps.v1", JSON.stringify(seedCamps()));
      }
    } catch {
      // ignore — app works with empty collections
    }
  }, []);
  return <>{children}</>;
}
