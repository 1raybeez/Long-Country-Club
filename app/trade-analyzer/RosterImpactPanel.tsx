"use client";

import type { RosterImpactResult } from "../../lib/trade-analyzer/rosterImpactTypes";

const number = (value: number | null) => value === null ? "Unavailable" : value.toFixed(2);
const signed = (value: number | null) => value === null ? "Unavailable" : `${value > 0 ? "+" : ""}${value.toFixed(2)}`;

export default function RosterImpactPanel({ result }: { result: RosterImpactResult | null | undefined }) {
  if (!result) return null;
  const headline = (participant: RosterImpactResult["participants"][number]) => {
    const roster = participant.delta.rosterStrength;
    const lineup = participant.delta.expectedLineupStrength;
    if (roster === null || lineup === null) return "Roster impact unavailable";
    if (roster > 0 && lineup > 0) return "Improves current roster";
    if (roster < 0 && lineup < 0) return "Reduces current roster strength";
    if (roster === 0 && lineup === 0) return "Little immediate lineup change";
    return "Mixed immediate impact";
  };
  const explanation = (participant: RosterImpactResult["participants"][number]) => {
    const roster = participant.delta.rosterStrength;
    const lineup = participant.delta.expectedLineupStrength;
    if (roster === null || lineup === null) return "Some roster-impact measurements are unavailable.";
    return `${roster > 0 ? "Overall roster strength improves" : roster < 0 ? "Overall roster strength declines" : "Overall roster strength is unchanged"}, while ${lineup > 0 ? "the current expected starting lineup projects higher" : lineup < 0 ? "the current expected starting lineup projects lower" : "the current expected starting lineup is unchanged"}.`;
  };
  return <section className="lcc2-card lcc2-card--raised p-5 sm:p-6" aria-labelledby="roster-impact-heading"><p className="lcc2-label">Roster Impact</p><h2 id="roster-impact-heading" className="mt-1 font-ui text-2xl font-black text-[var(--lcc-color-text)]">Current roster before and after</h2><p className="lcc2-body mt-2">This factual comparison uses the current LCC roster and canonical expected-lineup rules. It does not change market fairness or make a trade recommendation.</p><div className="mt-5 grid gap-4 md:grid-cols-2">{result.participants.map((participant) => <article key={participant.franchiseId} className="rounded-lg border border-[var(--lcc-color-border)] p-4"><div className="flex items-center justify-between gap-3"><h3 className="font-ui text-lg font-black text-[var(--lcc-color-text)]">{participant.franchiseName}</h3><span className="lcc2-label">{participant.status}</span></div><p className="mt-2 font-ui text-base font-black text-[var(--lcc-brand-primary)]">{headline(participant)}</p><p className="lcc2-body mt-1">{explanation(participant)}</p><ImpactMetric label="Roster Strength" before={participant.before.rosterStrength} after={participant.after.rosterStrength} delta={participant.delta.rosterStrength} /><ImpactMetric label="Starting Lineup Strength" before={participant.before.expectedLineupStrength} after={participant.after.expectedLineupStrength} delta={participant.delta.expectedLineupStrength} /><div className="mt-4"><p className="lcc2-label">Lineup Changes</p>{participant.changes.startersAdded.map((player) => <p key={`add-${player.playerId}`} className="lcc2-body mt-1">+ {player.name} enters {player.slot}</p>)}{participant.changes.startersRemoved.map((player) => <p key={`remove-${player.playerId}`} className="lcc2-body mt-1">− {player.name} leaves {player.slot}</p>)}{!participant.changes.startersAdded.length && !participant.changes.startersRemoved.length ? <p className="lcc2-body mt-1">No expected-lineup changes.</p> : null}</div><div className="mt-4"><p className="lcc2-label">Depth Impact</p><div className="mt-2 flex flex-wrap gap-2">{participant.changes.positionalDepthChanges.filter((change) => change.change !== "UNCHANGED").map((change) => <span key={change.position} className="rounded-full border border-[var(--lcc-color-border)] px-2 py-1 text-xs font-bold">{change.position} {change.change.toLowerCase()}</span>)}{participant.changes.positionalDepthChanges.every((change) => change.change === "UNCHANGED") ? <span className="text-sm text-[var(--lcc-color-text-muted)]">Unchanged</span> : null}</div></div><p className="mt-4 text-xs text-[var(--lcc-color-text-muted)]">Projected weekly points: {number(participant.before.projectedWeeklyPoints)} → {number(participant.after.projectedWeeklyPoints)}</p></article>)}</div><p className="mt-4 text-xs text-[var(--lcc-color-text-muted)]">Model: {result.modelVersion}. Draft picks have no immediate lineup impact.</p></section>;
}

function ImpactMetric({ label, before, after, delta }: { label: string; before: number | null; after: number | null; delta: number | null }) { return <div className="mt-4"><p className="lcc2-label">{label}</p><p className="mt-1 font-ui text-sm font-bold text-[var(--lcc-color-text)]">Before {number(before)} <span className="px-1 text-[var(--lcc-color-text-muted)]">→</span> After {number(after)} <span className="ml-1">({signed(delta)})</span></p></div>; }
