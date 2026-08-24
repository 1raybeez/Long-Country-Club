import { loadAllDraftEvents } from './drafts';
import { getLccOwnerById } from '../lccOwners';
import type { DraftEventData, DraftPickRecord } from '../types/draft';

export type DraftRecordCategory = 'top' | 'rookie' | 'position' | 'era';

export interface DraftRecordHolder {
  readonly ownerId: string;
  readonly ownerName: string;
  readonly teamName: string;
}

export interface DraftRecordSubject {
  readonly season: number;
  readonly draftId: string;
  readonly playerId?: string | null;
  readonly playerName?: string | null;
  readonly position?: string | null;
  readonly ownerId?: string | null;
  readonly ownerName?: string | null;
  readonly teamName?: string | null;
}

export interface DraftRecord {
  readonly recordId: string;
  readonly category: DraftRecordCategory;
  readonly era: string;
  readonly label: string;
  readonly value: number;
  readonly unit: string;
  readonly holders: readonly DraftRecordHolder[];
  readonly subjects: readonly DraftRecordSubject[];
  readonly season?: number;
  readonly draftId?: string;
  readonly sourceReference: string;
  readonly tieCount: number;
  readonly notes?: string;
}

export interface DraftPositionRecord {
  readonly position: string;
  readonly overall: number;
  readonly rookie: number;
}

const EVENTS = loadAllDraftEvents();
const PICKS = EVENTS.flatMap((draft) => draft.picks.map((pick) => ({ pick, draft })));
const ROOKIE_PICKS = PICKS.filter(({ draft }) => draft.draftType === 'rookie');
const INDEX_SOURCE = 'data/history/drafts/index.json';

export function getDraftRecordSummary(): readonly DraftRecord[] {
  return [
    createOwnerCountRecord('most-canonical-picks', 'top', 'Most canonical picks', 'All Canonical History', PICKS.map(({ pick }) => pick), 'picks'),
    createOwnerCountRecord('most-rookie-picks', 'top', 'Most rookie picks', '2021–2026 Rookie Drafts', ROOKIE_PICKS.map(({ pick }) => pick), 'picks'),
    createOwnerCountRecord('most-first-round-rookie-picks', 'top', 'Most first-round rookie picks', '2021–2026 Rookie Drafts', ROOKIE_PICKS.filter(({ pick }) => pick.round === 1).map(({ pick }) => pick), 'picks'),
    createLargestOwnerEventRecord(),
  ];
}

export function getRookieDraftRecords(): readonly DraftRecord[] {
  return [
    createOwnerCountRecord('rookie-most-picks', 'rookie', 'Most rookie picks', '2021–2026 Rookie Drafts', ROOKIE_PICKS.map(({ pick }) => pick), 'picks'),
    createOwnerCountRecord('rookie-most-first-round-picks', 'rookie', 'Most first-round rookie picks', '2021–2026 Rookie Drafts', ROOKIE_PICKS.filter(({ pick }) => pick.round === 1).map(({ pick }) => pick), 'picks'),
    ...['QB', 'RB', 'WR', 'TE'].map((position) => createEarliestPositionRecord(position)),
  ];
}

export function getPositionDraftRecords(): { readonly overall: readonly DraftPositionRecord[]; readonly rookie: readonly DraftPositionRecord[] } {
  const positions = [...new Set(PICKS.map(({ pick }) => pick.position).filter((position): position is string => Boolean(position)))];
  return {
    overall: positions.map((position) => ({ position, overall: PICKS.filter(({ pick }) => pick.position === position).length, rookie: ROOKIE_PICKS.filter(({ pick }) => pick.position === position).length })).sort((a, b) => b.overall - a.overall || a.position.localeCompare(b.position)),
    rookie: positions.map((position) => ({ position, overall: PICKS.filter(({ pick }) => pick.position === position).length, rookie: ROOKIE_PICKS.filter(({ pick }) => pick.position === position).length })).filter((record) => record.rookie > 0).sort((a, b) => b.rookie - a.rookie || a.position.localeCompare(b.position)),
  };
}

export function getEraDraftRecords(): readonly DraftRecord[] {
  const largest = [...EVENTS].sort((a, b) => b.pickCount - a.pickCount)[0];
  const longest = [...EVENTS].sort((a, b) => b.rounds - a.rounds)[0];
  const mostTraded = [...EVENTS].sort((a, b) => b.tradedPicks.length - a.tradedPicks.length)[0];
  return [
    createEventRecord('largest-draft', 'Largest draft event', largest, largest.pickCount, 'picks'),
    createEventRecord('longest-draft', 'Longest draft event', longest, longest.rounds, 'rounds'),
    createEventRecord('most-traded-pick-records', 'Most traded-pick records', mostTraded, mostTraded.tradedPicks.length, 'records'),
  ];
}

function createOwnerCountRecord(recordId: string, category: DraftRecordCategory, label: string, era: string, picks: readonly DraftPickRecord[], unit: string): DraftRecord {
  const counts = countByOwner(picks);
  const value = Math.max(...counts.values());
  const holders = [...counts.entries()].filter(([, count]) => count === value).map(([ownerId]) => createHolder(ownerId)).sort((a, b) => a.ownerName.localeCompare(b.ownerName));
  return { recordId, category, era, label, value, unit, holders, subjects: [], sourceReference: INDEX_SOURCE, tieCount: holders.length, notes: holders.length > 1 ? `${holders.length}-way tie` : undefined };
}

function createLargestOwnerEventRecord(): DraftRecord {
  const eventRows = EVENTS.flatMap((draft) => [...countByOwner(draft.picks).entries()].map(([ownerId, count]) => ({ draft, ownerId, count })));
  const value = Math.max(...eventRows.map((row) => row.count));
  const rows = eventRows.filter((row) => row.count === value);
  const event = rows[0].draft;
  const holders = rows.filter((row) => row.draft.draftId === event.draftId).map((row) => createHolder(row.ownerId)).sort((a, b) => a.ownerName.localeCompare(b.ownerName));
  return { recordId: 'most-picks-one-draft', category: 'top', era: getEventEra(event), label: 'Most picks in one draft', value, unit: 'picks', holders, subjects: [], season: event.season, draftId: event.draftId, sourceReference: eventSource(event), tieCount: holders.length, notes: `${holders.length}-way tie · ${formatDraftContext(event)}` };
}

function createEarliestPositionRecord(position: string): DraftRecord {
  const matches = ROOKIE_PICKS.filter(({ pick }) => pick.position === position);
  const value = Math.min(...matches.map(({ pick }) => pick.overallPick ?? Number.MAX_SAFE_INTEGER));
  const subjects = matches.filter(({ pick }) => pick.overallPick === value).map(({ pick, draft }) => createSubject(pick, draft)).sort((a, b) => a.season - b.season || (a.playerName ?? '').localeCompare(b.playerName ?? ''));
  return { recordId: `earliest-rookie-${position.toLowerCase()}`, category: 'rookie', era: '2021–2026 Rookie Drafts', label: `Earliest rookie ${position} selected`, value, unit: 'pick', holders: [], subjects, sourceReference: INDEX_SOURCE, tieCount: subjects.length, notes: subjects.length > 1 ? `${subjects.length}-way tie` : undefined };
}

function createEventRecord(recordId: string, label: string, event: DraftEventData, value: number, unit: string): DraftRecord {
  return { recordId, category: 'era', era: getEventEra(event), label, value, unit, holders: [], subjects: [], season: event.season, draftId: event.draftId, sourceReference: eventSource(event), tieCount: 1, notes: formatDraftContext(event) };
}

function countByOwner(picks: readonly DraftPickRecord[]) {
  const counts = new Map<string, number>();
  picks.forEach((pick) => { if (pick.canonicalOwnerId) counts.set(pick.canonicalOwnerId, (counts.get(pick.canonicalOwnerId) ?? 0) + 1); });
  return counts;
}

function createHolder(ownerId: string): DraftRecordHolder {
  const owner = getLccOwnerById(ownerId);
  return { ownerId, ownerName: owner?.displayName ?? ownerId, teamName: owner?.managerPage.sleeperName ?? 'Historical team context unavailable' };
}

function createSubject(pick: DraftPickRecord, draft: DraftEventData): DraftRecordSubject {
  const holder = pick.canonicalOwnerId ? createHolder(pick.canonicalOwnerId) : undefined;
  return { season: draft.season, draftId: draft.draftId, playerId: pick.playerId, playerName: pick.playerName, position: pick.position, ownerId: pick.canonicalOwnerId, ownerName: holder?.ownerName, teamName: holder?.teamName };
}

function getEventEra(draft: DraftEventData) {
  if (draft.draftType === 'keeper-veteran') return '2019–2020 Sleeper Keeper Era';
  if (draft.draftType === 'dynasty-startup') return '2021 Dynasty Startup';
  return '2021–2026 Rookie Draft Era';
}

function formatDraftContext(draft: DraftEventData) {
  if (draft.draftType === 'keeper-veteran') return `${draft.season} Keeper/Veteran Draft`;
  if (draft.draftType === 'dynasty-startup') return `${draft.season} Dynasty Startup Draft`;
  return `${draft.season} Rookie Draft`;
}

function eventSource(draft: DraftEventData) {
  return `data/history/drafts/${draft.season}/drafts.json#${draft.draftId}`;
}
