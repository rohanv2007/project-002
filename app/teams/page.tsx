"use client";

import { useMemo, useState } from "react";
import { useDonors, useTeams, uid } from "@/lib/store";
import { isEffectivelyAvailable, isEligibleByInterval } from "@/lib/blood";
import { EmptyState, Field, GroupBadge, PageHeader, inputCls } from "@/components/ui";

/**
 * Donor teams — researched insight: the Red Cross Blood Donor app's
 * "lifesaving teams" and leaderboard. Campus clubs, neighbourhoods, and
 * workplaces recruit together and climb the board.
 */
export default function TeamsPage() {
  const [teams, , addTeam, updateTeam, removeTeam] = useTeams();
  const [donors] = useDonors();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [joinFor, setJoinFor] = useState<Record<string, string>>({});

  const donorById = useMemo(() => new Map(donors.map((d) => [d.id, d])), [donors]);

  const ranked = useMemo(
    () =>
      [...teams]
        .map((t) => {
          const members = t.memberIds.map((id) => donorById.get(id)).filter(Boolean);
          const units = members.reduce((s, m) => s + (m?.donations ?? 0), 0);
          // Members who could actually donate tonight — this is what matters
          // when a club is pinged for an emergency.
          const ready = members.filter(
            (m) => m && isEffectivelyAvailable(m) && isEligibleByInterval(m.lastDonation)
          ).length;
          return { team: t, members, units, ready };
        })
        .sort((a, b) => b.units - a.units || b.members.length - a.members.length),
    [teams, donorById]
  );

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    addTeam({
      id: uid("team"),
      name: n,
      description: description.trim() || "A group of regular lifesavers.",
      memberIds: [],
      createdAt: new Date().toISOString(),
    });
    setName("");
    setDescription("");
  };

  const join = (teamId: string, donorId: string) => {
    if (!donorId) return;
    const team = teams.find((t) => t.id === teamId);
    if (!team || team.memberIds.includes(donorId)) return;
    updateTeam(teamId, { memberIds: [...team.memberIds, donorId] });
    setJoinFor((p) => ({ ...p, [teamId]: "" }));
  };

  const leave = (teamId: string, donorId: string) => {
    const team = teams.find((t) => t.id === teamId);
    if (!team) return;
    updateTeam(teamId, { memberIds: team.memberIds.filter((id) => id !== donorId) });
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Donor teams"
        subtitle="Donate together, recruit together. Campus clubs, neighbourhoods, and offices climb the leaderboard by total lifetime donations."
      />

      {ranked.length > 0 && (
        <section aria-label="Team leaderboard">
          <h2 className="mb-3 text-base font-bold text-ink-900">Leaderboard</h2>
          <ul className="space-y-3">
            {ranked.map(({ team, members, units, ready }, i) => (
              <li key={team.id} className="rounded-2xl border border-ink-200 bg-white p-5">
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-bold tnum ${
                      i === 0 ? "bg-crimson-600 text-white" : "bg-ink-100 text-ink-700"
                    }`}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-ink-900">{team.name}</h3>
                    <p className="mt-0.5 text-sm text-ink-600">{team.description}</p>
                    <p className="tnum mt-2 text-sm text-ink-500">
                      <span className="font-bold text-ink-900">{members.length}</span> member{members.length === 1 ? "" : "s"}
                      {" · "}
                      <span className="font-bold text-crimson-700">{units}</span> lifetime donations
                      {" · "}
                      <span className="font-bold text-green-700">{ready}</span> ready now
                    </p>
                  </div>
                  <button
                    onClick={() => removeTeam(team.id)}
                    className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-ink-400 hover:bg-crimson-50 hover:text-crimson-700 min-h-[44px]"
                    aria-label={`Delete team ${team.name}`}
                  >
                    Delete
                  </button>
                </div>

                {members.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {members.map((m) =>
                      m ? (
                        <li
                          key={m.id}
                          className="flex items-center gap-2 rounded-full bg-ink-50 py-1 pl-1.5 pr-2"
                        >
                          <GroupBadge group={m.group} size="sm" />
                          <span className="text-xs font-semibold text-ink-800">{m.name}</span>
                          <span className="text-[11px] text-ink-500 tnum">{m.donations}×</span>
                          <button
                            onClick={() => leave(team.id, m.id)}
                            className="rounded-full px-1.5 text-xs font-bold text-ink-400 hover:text-crimson-700"
                            aria-label={`Remove ${m.name} from ${team.name}`}
                          >
                            ×
                          </button>
                        </li>
                      ) : null
                    )}
                  </ul>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <select
                    value={joinFor[team.id] ?? ""}
                    onChange={(e) => setJoinFor((p) => ({ ...p, [team.id]: e.target.value }))}
                    aria-label={`Choose a donor to join ${team.name}`}
                    className={`${inputCls} !w-auto min-w-[180px]`}
                  >
                    <option value="">Add a donor…</option>
                    {donors
                      .filter((d) => !team.memberIds.includes(d.id))
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.group})
                        </option>
                      ))}
                  </select>
                  <button
                    onClick={() => join(team.id, joinFor[team.id] ?? "")}
                    disabled={!joinFor[team.id]}
                    className="rounded-xl bg-crimson-600 px-4 py-2 text-sm font-semibold text-white hover:bg-crimson-700 disabled:opacity-40 min-h-[44px]"
                  >
                    Join team
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {ranked.length === 0 && (
        <EmptyState
          title="No teams yet"
          body="Start your college club, hostel floor, or neighbourhood group — teams make regular donation a friendly habit."
        />
      )}

      <section className="rounded-2xl border border-ink-200 bg-white p-5 sm:p-6">
        <h2 className="text-base font-bold text-ink-900">Start a team</h2>
        <form onSubmit={create} className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Team name">
            <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} placeholder="e.g. Block C Lifesavers" className={inputCls} />
          </Field>
          <Field label="Description">
            <input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={160} placeholder="Who are you and where are you?" className={inputCls} />
          </Field>
          <div className="sm:col-span-2">
            <button type="submit" className="rounded-xl bg-crimson-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-crimson-700 min-h-[44px]">
              Create team
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
