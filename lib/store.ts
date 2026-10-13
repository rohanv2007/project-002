"use client";

import { useCallback, useEffect, useState } from "react";
import type { Appointment, BloodBank, BloodRequest, CampEvent, Deferral, DonationRecord, Donor, Patient, Pledge, Reminder, Team, Watch } from "./types";

const KEYS = {
  donors: "raktha.donors.v1",
  requests: "raktha.requests.v1",
  banks: "raktha.banks.v1",
  donations: "raktha.donations.v1",
  teams: "raktha.teams.v1",
  reminders: "raktha.reminders.v1",
  camps: "raktha.camps.v1",
  pledges: "raktha.pledges.v1",
  watches: "raktha.watches.v1",
  patients: "raktha.patients.v1",
  deferrals: "raktha.deferrals.v1",
  appointments: "raktha.appointments.v1",
  seeded: "raktha.seeded.v1",
} as const;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or unavailable — keep the app working in-memory
  }
}

export function useLocalCollection<T extends { id: string }>(
  key: string,
  initial: T[]
): [T[], (items: T[]) => void, (item: T) => void, (id: string, patch: Partial<T>) => void, (id: string) => void] {
  const [items, setItems] = useState<T[]>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(read<T[]>(key, initial));
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const setAll = useCallback(
    (next: T[]) => {
      setItems(next);
      write(key, next);
    },
    [key]
  );

  const add = useCallback(
    (item: T) => {
      setItems((prev) => {
        const next = [item, ...prev];
        write(key, next);
        return next;
      });
    },
    [key]
  );

  const update = useCallback(
    (id: string, patch: Partial<T>) => {
      setItems((prev) => {
        const next = prev.map((i) => (i.id === id ? { ...i, ...patch } : i));
        write(key, next);
        return next;
      });
    },
    [key]
  );

  const remove = useCallback(
    (id: string) => {
      setItems((prev) => {
        const next = prev.filter((i) => i.id !== id);
        write(key, next);
        return next;
      });
    },
    [key]
  );

  return [hydrated ? items : initial, setAll, add, update, remove];
}

export function useDonors() {
  return useLocalCollection<Donor>(KEYS.donors, []);
}
export function useRequests() {
  return useLocalCollection<BloodRequest>(KEYS.requests, []);
}
export function useBanks() {
  return useLocalCollection<BloodBank>(KEYS.banks, []);
}
export function useDonations() {
  return useLocalCollection<DonationRecord>(KEYS.donations, []);
}
export function useTeams() {
  return useLocalCollection<Team>(KEYS.teams, []);
}
export function useReminders() {
  return useLocalCollection<Reminder>(KEYS.reminders, []);
}
export function useCamps() {
  return useLocalCollection<CampEvent>(KEYS.camps, []);
}

export function usePledges() {
  return useLocalCollection<Pledge>(KEYS.pledges, []);
}

export function useWatches() {
  return useLocalCollection<Watch>(KEYS.watches, []);
}

export function usePatients() {
  return useLocalCollection<Patient>(KEYS.patients, []);
}

export function useDeferrals() {
  return useLocalCollection<Deferral>(KEYS.deferrals, []);
}

export function useAppointments() {
  return useLocalCollection<Appointment>(KEYS.appointments, []);
}

export const MY_NAME_KEY = "raktha.myname.v1";

/** The donor's own display name, used on certificates. Local-only. */
export function readMyName(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(MY_NAME_KEY) ?? "";
  } catch {
    return "";
  }
}

export function writeMyName(name: string) {
  try {
    window.localStorage.setItem(MY_NAME_KEY, name);
  } catch {
    // ignore
  }
}

export function isSeeded(): boolean {
  return read(KEYS.seeded, false);
}
export function markSeeded() {
  write(KEYS.seeded, true);
}

export function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
