'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BookOpen,
  CalendarDays,
  CircleHelp,
  ClipboardList,
  Clock,
  FileText,
  GitCompareArrows,
  History,
  PackageOpen,
  Trophy,
} from 'lucide-react';
import { getLccChampionBySeason, getLccPlacementsBySeason } from '@/lib/lccFinalPlacements';
import { loadAllDrafts } from '@/lib/history/drafts';
import { getFuturePickAssetsByYear, getFuturePickInventory, getFuturePickYears } from '@/lib/history/futurePicks';
import { getDraftRecordSummary, getEraDraftRecords, getPositionDraftRecords, getRookieDraftRecords } from '@/lib/history/draftRecords';
import type { DraftEventData, SeasonDraftData } from '@/lib/types/draft';
import type { FuturePickAsset } from '@/lib/types/futurePick';
import type { DraftPositionRecord, DraftRecord } from '@/lib/history/draftRecords';
import { getLccOwnerById } from '@/lib/lccOwners';
import { LCC_CURRENT_SEASON } from '@/lib/leagueConstants';
import { getDraftResearchResources, getDraftToolResources, type LeagueResource } from '@/lib/resources';
import { DraftIntelligenceEvent } from '@/components/draft-intelligence/DraftIntelligencePanel';
import type { DraftGradesLayer } from '@/lib/history/draftIntelligencePresentation';
import { LeagueInfoShell } from '@/components/league/LeagueInfoShell';

type DraftRoomTab = 'history' | 'future' | 'records' | 'resources';

type DraftHistoryCard = {
  year: number;
  era: string;
  championEnteringDraft: string;
  seasonData: SeasonDraftData;
};

const CURRENT_DRAFT_YEAR = LCC_CURRENT_SEASON;
const DRAFT_HISTORY_YEARS = [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019];
const FUTURE_PICK_INVENTORY = getFuturePickInventory();
const FUTURE_PICK_YEARS = getFuturePickYears();

const DRAFT_HISTORY: readonly DraftHistoryCard[] = DRAFT_HISTORY_YEARS.map((year) => {
  const enteringChampion = getLccChampionBySeason(year - 1);
  const season = getLccPlacementsBySeason(year);
  const seasonData = loadAllDrafts().find((record) => record.season === year);

  return {
    year,
    era: formatEra(season?.era ?? 'dynasty'),
    championEnteringDraft: enteringChampion?.alias ?? 'Pending',
    seasonData: seasonData!,
  };
}).filter((record): record is DraftHistoryCard => Boolean(record.seasonData));

const TOTAL_IMPORTED_PICKS = DRAFT_HISTORY.reduce(
  (total, season) => total + season.seasonData.drafts.reduce((seasonTotal, draft) => seasonTotal + draft.pickCount, 0),
  0,
);

const DRAFT_TABS = [
  { label: 'Draft History', value: 'history', icon: <History className="h-4 w-4" aria-hidden="true" /> },
  { label: 'Future Picks', value: 'future', icon: <CalendarDays className="h-4 w-4" aria-hidden="true" /> },
  { label: 'Draft Records', value: 'records', icon: <Trophy className="h-4 w-4" aria-hidden="true" /> },
  { label: 'Draft Resources', value: 'resources', icon: <FileText className="h-4 w-4" aria-hidden="true" /> },
] as const;

export default function DraftRoomPage() {
  const [activeTab, setActiveTab] = useState<DraftRoomTab>('history');
  return (
    <LeagueInfoShell>
      <main className="lcc2-page-shell">
      <div className="lcc2-page-container">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="lcc2-label text-[var(--lcc-brand-primary)]">Drafts</p>
            <h1 className="mt-2 font-ui text-4xl font-black tracking-[-0.04em] text-[var(--lcc-color-text)] sm:text-5xl">Draft Room</h1>
            <p className="lcc2-body mt-3 max-w-2xl">Current and historical draft planning, future picks, draft records, and league resources.</p>
          </div>
          <div className="lcc2-badge lcc2-badge--info self-start lg:self-end">{CURRENT_DRAFT_YEAR} Draft HQ</div>
        </div>

        <DraftSection
          eyebrow="Current draft context"
          title="Rookie Draft Command Center"
          supporting="Historical drafts, future capital, draft records, resources, and LCC Draft Intelligence."
          action={<ClipboardList className="h-5 w-5 text-[var(--lcc-brand-secondary)]" aria-hidden="true" />}
          className="mb-6"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <DraftMetricCard icon={<History className="h-5 w-5" aria-hidden="true" />} label="Seasons Available" value={String(DRAFT_HISTORY.length)} helperText="Canonical history: 2019–2026" status="Available" />
            <DraftMetricCard icon={<ClipboardList className="h-5 w-5" aria-hidden="true" />} label="Total Draft Picks" value={String(TOTAL_IMPORTED_PICKS)} helperText="Canonical Sleeper picks" status="Available" />
            <DraftMetricCard icon={<CalendarDays className="h-5 w-5" aria-hidden="true" />} label="Latest Completed Draft" value={String(CURRENT_DRAFT_YEAR)} helperText="Current league season: 2026" status="Available" />
            <DraftMetricCard icon={<Clock className="h-5 w-5" aria-hidden="true" />} label="Next Draft Event" value="TBD" helperText="2027 draft date not set" status="TBD" />
          </div>
        </DraftSection>

        <DraftTabs activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === 'history' && <DraftHistoryPanel seasons={DRAFT_HISTORY} />}
        {activeTab === 'future' && <FuturePicksPanel />}
        {activeTab === 'records' && <DraftRecordsPanel />}
        {activeTab === 'resources' && <DraftResourcesPanel onNavigateTab={setActiveTab} />}
      </div>
      </main>
    </LeagueInfoShell>
  );
}

function DraftTabs({ activeTab, onChange }: { activeTab: DraftRoomTab; onChange: (value: DraftRoomTab) => void }) {
  return (
    <div role="tablist" aria-label="Draft Room views" className="mb-6 flex flex-wrap gap-2 rounded-xl border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface)] p-1.5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
      {DRAFT_TABS.map((tab) => {
        const isActive = activeTab === tab.value;
        return (
          <button key={tab.value} id={`draft-tab-${tab.value}`} type="button" role="tab" aria-selected={isActive} aria-controls={`draft-panel-${tab.value}`} onClick={() => onChange(tab.value)} className={`inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 font-ui text-xs font-black uppercase tracking-[0.04em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lcc-interactive-focus)] sm:flex-none ${isActive ? 'bg-[var(--lcc-interactive-active)] text-white' : 'text-[var(--lcc-color-text-muted)] hover:bg-[var(--lcc-color-surface-muted)] hover:text-[var(--lcc-color-text)]'}`}>
            {tab.icon}{tab.label}
          </button>
        );
      })}
    </div>
  );
}

function DraftHistoryPanel({ seasons }: { seasons: readonly DraftHistoryCard[] }) {
  const [selectedSeason, setSelectedSeason] = useState(2026);
  const [selectedDraftId, setSelectedDraftId] = useState('');
  const [view, setView] = useState<'board' | 'grades' | 'table'>('board');
  const [gradeView, setGradeView] = useState<DraftGradesLayer>('draft-day');
  const selectedSeasonData = seasons.find((season) => season.year === selectedSeason) ?? seasons[0];
  const events = selectedSeasonData?.seasonData.drafts ?? [];
  const selectedDraft = events.find((draft) => draft.draftId === selectedDraftId) ?? events.find((draft) => draft.draftType === 'rookie') ?? events[0];
  const hasGrades = Boolean(selectedDraft && selectedDraft.draftType === 'rookie' && selectedDraft.season >= 2021);

  useEffect(() => {
    const applyUrlState = () => {
      const params = new URLSearchParams(window.location.search);
      const requestedSeason = Number(params.get('season'));
      const requestedView = params.get('view');
      const requestedGradeView = params.get('gradeView');
      const requestedEvent = params.get('event');
      if (seasons.some((season) => season.year === requestedSeason)) setSelectedSeason(requestedSeason);
      if (requestedView === 'board' || requestedView === 'grades' || requestedView === 'table') setView(requestedView);
      if (requestedGradeView === 'draft-day' || requestedGradeView === 'outcome' || requestedGradeView === 'reality') setGradeView(requestedGradeView);
      if (requestedEvent) setSelectedDraftId(requestedEvent);
    };
    applyUrlState();
    window.addEventListener('popstate', applyUrlState);
    return () => window.removeEventListener('popstate', applyUrlState);
  }, [seasons]);

  useEffect(() => {
    if (selectedDraft && selectedDraft.draftId !== selectedDraftId) setSelectedDraftId(selectedDraft.draftId);
    if (!hasGrades && view === 'grades') setView('board');
    if (!hasGrades && gradeView !== 'draft-day') setGradeView('draft-day');
  }, [gradeView, hasGrades, selectedDraft, selectedDraftId, view]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('season', String(selectedSeasonData?.year ?? 2026));
    if (selectedDraft) params.set('event', selectedDraft.draftId);
    params.set('view', view);
    if (view === 'grades') params.set('gradeView', gradeView);
    else params.delete('gradeView');
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  }, [gradeView, selectedDraft, selectedSeasonData?.year, selectedSeason, view]);

  const selectSeason = (year: number) => {
    const nextSeason = seasons.find((season) => season.year === year);
    const nextEvent = nextSeason?.seasonData.drafts.find((draft) => draft.draftType === 'rookie') ?? nextSeason?.seasonData.drafts[0];
    setSelectedSeason(year);
    setSelectedDraftId(nextEvent?.draftId ?? '');
    setView('board');
    setGradeView('draft-day');
  };

  if (!selectedSeasonData || !selectedDraft) return null;
  return (
    <DraftSection id="draft-panel-history" eyebrow="Canonical history" title="Draft History" supporting="Explore every LCC Sleeper-era draft, pick by pick, with Draft Grades for the Dynasty rookie era." action={<History className="h-5 w-5 text-[var(--lcc-brand-secondary)]" aria-hidden="true" />}>
      <div className="grid gap-4 rounded-xl border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface)] p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <label className="block" htmlFor="draft-history-season"><span className="lcc2-label text-[var(--lcc-brand-secondary)]">Select season</span><select id="draft-history-season" value={selectedSeasonData.year} onChange={(event) => selectSeason(Number(event.target.value))} className="mt-2 min-h-11 w-full rounded-lg border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface-raised)] px-3 font-ui text-sm font-black text-[var(--lcc-color-text)] focus-visible:outline-2 focus-visible:outline-[var(--lcc-interactive-focus)]">{seasons.map((season) => <option key={season.year} value={season.year}>{season.year}</option>)}</select></label>
        <div><p className="lcc2-label text-[var(--lcc-brand-secondary)]">Draft context</p><p className="mt-2 font-ui text-sm font-semibold text-[var(--lcc-color-text-muted)]">Champion entering draft: <span className="font-black text-[var(--lcc-color-text)]">{selectedSeasonData.championEnteringDraft}</span></p></div>
      </div>

      {selectedSeason === 2021 && <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="2021 draft events">{events.map((draft) => <button key={draft.draftId} type="button" role="tab" aria-selected={selectedDraft.draftId === draft.draftId} onClick={() => { setSelectedDraftId(draft.draftId); setView('board'); setGradeView('draft-day'); }} className={`min-h-10 rounded-lg border px-4 py-2 font-ui text-xs font-black uppercase tracking-[0.04em] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lcc-interactive-focus)] ${selectedDraft.draftId === draft.draftId ? 'border-[var(--lcc-interactive)] bg-[var(--lcc-interactive)] text-white' : 'border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface-raised)] text-[var(--lcc-color-text-muted)] hover:border-[var(--lcc-interactive)]'}`}>{getDraftTypeLabel(draft)}</button>)}</div>}

      <section className="mt-4 rounded-xl border border-[var(--lcc-color-border-strong)] bg-[var(--lcc-color-surface-raised)] p-4" aria-labelledby="selected-draft-heading">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="lcc2-label text-[var(--lcc-brand-secondary)]">Selected event</p><h3 id="selected-draft-heading" className="mt-1 font-ui text-2xl font-black tracking-[-0.03em] text-[var(--lcc-color-text)]">{selectedDraft.season} {getDraftTypeLabel(selectedDraft)}</h3><p className="mt-2 font-ui text-sm font-semibold text-[var(--lcc-color-text-muted)]">{formatDraftDate(selectedDraft.startTime)} · {selectedDraft.rounds} Rounds · {selectedDraft.pickCount} Picks · {selectedDraft.draftOrderType} · {selectedDraft.tradedPicks.length} Trade Records</p></div><div className="flex flex-wrap gap-2">{hasGrades && <StatusBadge label={selectedDraft.season === 2026 ? 'Approved & frozen' : 'Historical backtest'} />}<StatusBadge label={selectedDraft.verificationStatus === 'full' ? 'Verified source' : 'Partial source'} /></div></div>
        <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Selected draft views">{(['board', ...(hasGrades ? ['grades'] : []), 'table'] as string[]).map((tab) => <button key={tab} id={`draft-view-tab-${tab}`} type="button" role="tab" aria-selected={view === tab} aria-controls={`draft-view-panel-${tab}`} onClick={() => setView(tab as 'board' | 'grades' | 'table')} className={`min-h-10 rounded-lg border px-4 py-2 font-ui text-xs font-black uppercase tracking-[0.04em] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lcc-interactive-focus)] ${view === tab ? 'border-[var(--lcc-interactive)] bg-[var(--lcc-interactive)] text-white' : 'border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface)] text-[var(--lcc-color-text-muted)] hover:border-[var(--lcc-interactive)]'}`}>{tab === 'board' ? 'Draft Board' : tab === 'grades' ? 'Draft Grades' : 'Table'}</button>)}</div>
      </section>
      {!hasGrades && selectedDraft.draftType !== 'dynasty-startup' && <p className="mt-3 rounded-lg border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface-muted)] px-4 py-3 font-ui text-sm font-semibold text-[var(--lcc-color-text-muted)]">Draft Intelligence grading is not yet available for Keeper-era drafts.</p>}
      {view === 'board' && <div id="draft-view-panel-board" role="tabpanel" aria-labelledby="draft-view-tab-board"><VisualDraftBoard draft={selectedDraft} /></div>}
      {view === 'table' && <div id="draft-view-panel-table" role="tabpanel" aria-labelledby="draft-view-tab-table"><DraftTableView draft={selectedDraft} /></div>}
      {view === 'grades' && hasGrades && <div id="draft-view-panel-grades" role="tabpanel" aria-labelledby="draft-view-tab-grades"><DraftIntelligenceEvent key={`${selectedDraft.season}:${selectedDraft.draftId}:${gradeView}`} season={selectedDraft.season} draftType={selectedDraft.draftType} gradeView={gradeView} onGradeViewChange={setGradeView} /></div>}
    </DraftSection>
  );
}

function VisualDraftBoard({ draft }: { draft: DraftEventData }) {
  const boardScrollRef = useRef<HTMLDivElement>(null);
  const rounds = Array.from(new Set(draft.picks.map((pick) => pick.round).filter((round): round is number => round !== null))).sort((a, b) => a - b);
  const slots = Array.from({ length: 12 }, (_, index) => index + 1);
  useEffect(() => {
    boardScrollRef.current?.scrollTo({ left: 0, behavior: 'auto' });
  }, [draft.draftId]);
  return (
    <div className="p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="lcc2-body text-sm">Draft board by round and draft slot. Pick order remains sourced from Sleeper metadata.</p>
        {draft.tradedPicks.length > 0 && <p className="font-ui text-xs font-bold text-[var(--lcc-color-text-muted)]">Trade lineage is preserved separately from final selections.</p>}
      </div>
      <div ref={boardScrollRef} tabIndex={0} aria-label="Horizontal draft board" className="overflow-x-auto rounded-lg border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lcc-interactive-focus)]">
        <div className="w-max min-w-[140rem] pr-6">
          <div className="sticky top-0 z-10 grid bg-[var(--lcc-color-midnight)] text-white" style={{ gridTemplateColumns: '5rem repeat(12, 11rem)' }}>
            <div className="border-r border-white/10 px-3 py-3 font-ui text-[0.65rem] font-black uppercase">Round</div>
            {slots.map((slot) => <DraftBoardManagerHeader key={slot} draft={draft} slot={slot} />)}
          </div>
          {rounds.map((round) => (
            <div key={round} className="grid border-t border-[var(--lcc-color-border)]" style={{ gridTemplateColumns: '5rem repeat(12, 11rem)' }}>
              <div className="border-r border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface-muted)] px-3 py-4 font-ui text-sm font-black text-[var(--lcc-color-text)]">R{round}</div>
              {slots.map((slot) => <DraftBoardPickCell key={`${round}-${slot}`} draft={draft} pick={draft.picks.find((pick) => pick.round === round && pick.draftSlot === slot) ?? null} />)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DraftBoardManagerHeader({ draft, slot }: { draft: DraftEventData; slot: number }) {
  const originalOwnerId = getOriginalSlotOwnerId(draft, slot);
  const owner = originalOwnerId ? getLccOwnerById(originalOwnerId) : undefined;
  return <div className="min-h-[6.25rem] border-r border-white/10 px-3 py-3"><p className="font-ui text-[0.62rem] font-black uppercase tracking-[0.08em] text-white/60">Slot {slot}</p><p className="mt-1 font-ui text-[0.65rem] font-black uppercase tracking-[0.04em] text-white/60">Original draft position</p><p className="mt-2 break-words font-ui text-sm font-black leading-tight">{owner?.displayName ?? 'Historical owner unavailable'}</p><p className="mt-1 break-words font-ui text-[0.68rem] font-semibold leading-tight text-white/65">{owner?.managerPage.sleeperName ?? 'Slot context only'}</p></div>;
}

function DraftBoardPickCell({ draft, pick }: { draft: DraftEventData; pick: DraftEventData['picks'][number] | null }) {
  if (!pick) return <div className="min-h-[8rem] border-r border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface-muted)] p-2" />;
  const actualOwner = pick.canonicalOwnerId ? getLccOwnerById(pick.canonicalOwnerId) : undefined;
  const isTraded = isPickOwnerDifferentFromOriginalSlot(draft, pick);
  return <div className="min-h-[10rem] border-r border-[var(--lcc-color-border)] p-2"><div className={`h-full rounded-lg border bg-[var(--lcc-color-surface-raised)] p-3 shadow-[0_6px_16px_rgba(15,23,42,0.07)] ${isTraded ? 'border-[color-mix(in_srgb,var(--lcc-semantic-warning)_55%,var(--lcc-color-border))]' : 'border-[var(--lcc-color-border)]'}`}><div className="flex items-start justify-between gap-2"><span className="font-ui text-[0.65rem] font-black uppercase text-[var(--lcc-interactive)]">Pick {pick.overallPick}</span>{isTraded && <span className="lcc2-badge lcc2-badge--warning">Traded pick</span>}</div><div className="mt-3 flex items-start gap-3"><PlayerHeadshot pick={pick} /><div className="min-w-0"><p className="font-ui text-sm font-black leading-tight text-[var(--lcc-color-text)]">{pick.playerName ?? pick.playerId ?? 'Unknown player'}</p><div className="mt-2 flex flex-wrap items-center gap-2"><span className={`lcc2-badge ${getPositionBadgeClass(pick.position)}`}>{pick.position ?? '—'}</span><span className="font-ui text-xs font-bold text-[var(--lcc-color-text-muted)]">{pick.nflTeam ?? '—'}</span></div></div></div><div className="mt-3 border-t border-[var(--lcc-color-border)] pt-2"><p className="font-ui text-[0.6rem] font-black uppercase tracking-[0.08em] text-[var(--lcc-color-text-muted)]">Drafted by</p><p className="mt-1 break-words font-ui text-xs font-black leading-tight text-[var(--lcc-color-text)]">{actualOwner?.displayName ?? pick.sleeperUserId ?? 'Unresolved owner'}</p><p className="mt-0.5 break-words font-ui text-[0.65rem] font-semibold leading-tight text-[var(--lcc-color-text-muted)]">{actualOwner?.managerPage.sleeperName ?? 'Historical identity unavailable'}</p></div></div></div>;
}

function getOriginalSlotOwnerId(draft: DraftEventData, slot: number) {
  const canonicalBySleeper = new Map(draft.picks.filter((pick) => pick.sleeperUserId && pick.canonicalOwnerId).map((pick) => [pick.sleeperUserId, pick.canonicalOwnerId]));
  const entry = Object.entries(draft.draftOrder).find(([, originalSlot]) => Number(originalSlot) === slot);
  return entry ? canonicalBySleeper.get(entry[0]) ?? null : null;
}

function isPickOwnerDifferentFromOriginalSlot(draft: DraftEventData, pick: DraftEventData['picks'][number]) {
  const originalOwnerId = pick.draftSlot === null ? null : getOriginalSlotOwnerId(draft, pick.draftSlot);
  return Boolean(originalOwnerId && pick.canonicalOwnerId && originalOwnerId !== pick.canonicalOwnerId);
}

function getPositionBadgeClass(position: string | null) {
  if (position === 'QB') return 'lcc2-badge--info';
  if (position === 'RB') return 'lcc2-badge--positive';
  if (position === 'WR') return 'lcc2-badge--warning';
  return 'lcc2-badge--neutral';
}

function PlayerHeadshot({ pick }: { pick: DraftEventData['picks'][number] }) {
  const [failed, setFailed] = useState(false);
  const initials = (pick.playerName ?? pick.playerId ?? '?').split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
  const imageUrl = pick.playerId ? pick.position === 'DEF' ? `https://sleepercdn.com/images/team_logos/nfl/${pick.nflTeam?.toLowerCase()}.png` : `https://sleepercdn.com/content/nfl/players/${pick.playerId}.jpg` : null;
  return <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface-muted)] font-ui text-xs font-black text-[var(--lcc-color-text-muted)]">{imageUrl && !failed ? <img src={imageUrl} alt={`${pick.playerName ?? 'Player'} headshot`} className="h-full w-full object-cover" onError={() => setFailed(true)} /> : initials}</div>;
}

function DraftTableView({ draft }: { draft: DraftEventData }) {
  return <div className="max-h-[34rem] overflow-auto"><table className="w-full min-w-[900px] border-collapse text-left"><thead className="sticky top-0 bg-[var(--lcc-color-midnight)] text-white"><tr className="font-ui text-[0.65rem] font-black uppercase"><th className="px-3 py-3">Pick</th><th className="px-3 py-3">Player</th><th className="px-3 py-3">Pos</th><th className="px-3 py-3">NFL</th><th className="px-3 py-3">Drafted by</th><th className="px-3 py-3">Original slot</th><th className="px-3 py-3">Trade context</th></tr></thead><tbody className="divide-y divide-[var(--lcc-color-border)]">{draft.picks.map((pick) => { const originalOwnerId = pick.draftSlot === null ? null : getOriginalSlotOwnerId(draft, pick.draftSlot); const traded = isPickOwnerDifferentFromOriginalSlot(draft, pick); return <tr key={`${draft.draftId}-${pick.overallPick}`} className="font-ui text-sm hover:bg-[var(--lcc-color-surface-muted)]"><td className="px-3 py-3 font-black text-[var(--lcc-color-text)]">{pick.round}.{String(pick.pickInRound).padStart(2, '0')}</td><td className="px-3 py-3 font-black text-[var(--lcc-color-text)]">{pick.playerName ?? pick.playerId ?? 'Unknown player'}</td><td className="px-3 py-3 text-[var(--lcc-color-text-muted)]">{pick.position ?? '—'}</td><td className="px-3 py-3 text-[var(--lcc-color-text-muted)]">{pick.nflTeam ?? '—'}</td><td className="px-3 py-3 text-[var(--lcc-color-text-muted)]">{formatDraftOwner(pick.canonicalOwnerId, pick.sleeperUserId)}</td><td className="px-3 py-3 text-[var(--lcc-color-text-muted)]">{pick.draftSlot ?? '—'} · {originalOwnerId ? formatDraftOwner(originalOwnerId, null) : 'Unavailable'}</td><td className="px-3 py-3 text-xs font-bold text-[var(--lcc-color-text-muted)]">{traded ? 'Traded pick' : 'Original slot'}</td></tr>; })}</tbody></table></div>;
}

function FuturePicksPanel() {
  const [selectedYear, setSelectedYear] = useState<number>(FUTURE_PICK_YEARS[0] ?? 2027);
  const [roundFilter, setRoundFilter] = useState<number | null>(null);
  const assets = getFuturePickAssetsByYear(selectedYear);
  const visibleAssets = roundFilter ? assets.filter((asset) => asset.round === roundFilter) : assets;
  const ownerGroups = buildFuturePickOwnerGroups(assets, visibleAssets);
  const tradedAssets = assets.filter((asset) => asset.isTraded).length;
  const retainedAssets = assets.length - tradedAssets;
  const isFormatDerived = assets.some((asset) => asset.verificationStatus === 'format-derived');
  const roundCounts = Array.from({ length: FUTURE_PICK_INVENTORY.rookieDraftRounds }, (_, index) => assets.filter((asset) => asset.round === index + 1).length);

  return (
    <DraftSection id="draft-panel-future" eyebrow="Dynasty assets" title="Future Picks" supporting="Track verified future rookie-pick ownership across the league." action={<CalendarDays className="h-5 w-5 text-[var(--lcc-brand-secondary)]" aria-hidden="true" />}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DraftMetricCard icon={<CalendarDays className="h-5 w-5" aria-hidden="true" />} label="Future Seasons Tracked" value={String(FUTURE_PICK_YEARS.length)} helperText="2027–2028 inventory" status="Available" />
        <DraftMetricCard icon={<PackageOpen className="h-5 w-5" aria-hidden="true" />} label="Total Future Assets" value={String(FUTURE_PICK_INVENTORY.assets.length)} helperText="Format-preserved assets" status="Available" />
        <DraftMetricCard icon={<GitCompareArrows className="h-5 w-5" aria-hidden="true" />} label="Verified Traded Assets" value={String(FUTURE_PICK_INVENTORY.assets.filter((asset) => asset.isTraded && asset.verificationStatus === 'verified').length)} helperText="Current Sleeper state" status="Available" />
        <DraftMetricCard icon={<ClipboardList className="h-5 w-5" aria-hidden="true" />} label="Current League Format" value={`${FUTURE_PICK_INVENTORY.rosterCount} teams`} helperText={`${FUTURE_PICK_INVENTORY.rookieDraftRounds} rookie rounds`} status="Available" />
      </div>

      <div className="mt-6 flex flex-col gap-4 rounded-xl border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface)] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="lcc2-label text-[var(--lcc-brand-secondary)]">Select future year</p>
          <div role="tablist" aria-label="Future draft years" className="mt-3 flex flex-wrap gap-2">
            {FUTURE_PICK_YEARS.map((year) => <button key={year} type="button" role="tab" aria-selected={selectedYear === year} aria-controls="draft-panel-future" onClick={() => { setSelectedYear(year); setRoundFilter(null); }} className={`min-h-10 rounded-lg border px-4 py-2 font-ui text-xs font-black uppercase tracking-[0.05em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lcc-interactive-focus)] ${selectedYear === year ? 'border-[var(--lcc-brand-primary)] bg-[var(--lcc-brand-primary)] text-white' : 'border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface-raised)] text-[var(--lcc-color-text-muted)] hover:border-[var(--lcc-interactive)] hover:text-[var(--lcc-interactive)]'}`}>{year}</button>)}
          </div>
        </div>
        <FuturePickEvidence formatDerived={isFormatDerived} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface)] px-4 py-3 font-ui text-xs font-black uppercase tracking-[0.06em] text-[var(--lcc-color-text)]" aria-label={`${assets.length} total assets, ${roundCounts[0] ?? 0} per round, ${tradedAssets} traded, ${retainedAssets} retained`}>
        <span>{assets.length} total assets</span><span className="text-[var(--lcc-color-text-muted)]" aria-hidden="true">•</span><span>{roundCounts[0] ?? 0} per round</span><span className="text-[var(--lcc-color-text-muted)]" aria-hidden="true">•</span><span>{tradedAssets || '0 known'} traded</span><span className="text-[var(--lcc-color-text-muted)]" aria-hidden="true">•</span><span>{retainedAssets} retained</span><span className="basis-full font-semibold normal-case tracking-normal text-[var(--lcc-color-text-muted)]">No draft positions are assigned before draft order is determined.</span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="Filter future picks by round">
        <span className="mr-1 font-ui text-xs font-black uppercase tracking-[0.06em] text-[var(--lcc-color-text-muted)]">Show</span>
        <FutureRoundFilter label="All" selected={roundFilter === null} onClick={() => setRoundFilter(null)} />
        {Array.from({ length: FUTURE_PICK_INVENTORY.rookieDraftRounds }, (_, index) => <FutureRoundFilter key={index} label={`Round ${index + 1}`} selected={roundFilter === index + 1} onClick={() => setRoundFilter(index + 1)} />)}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {ownerGroups.map((group) => <FuturePickOwnerCard key={group.ownerId} group={group} />)}
      </div>
    </DraftSection>
  );
}

type FuturePickOwnerGroup = {
  ownerId: string;
  managerName: string;
  teamName: string;
  rosterId: number;
  holdings: readonly FuturePickAsset[];
  tradedAway: readonly FuturePickAsset[];
};

function buildFuturePickOwnerGroups(allAssets: readonly FuturePickAsset[], visibleAssets: readonly FuturePickAsset[]): FuturePickOwnerGroup[] {
  const ownerIds = [...new Set(allAssets.map((asset) => asset.currentOwnerId))];
  return ownerIds.map((ownerId) => {
    const firstCurrentAsset = allAssets.find((asset) => asset.currentOwnerId === ownerId)!;
    return {
      ownerId,
      managerName: firstCurrentAsset.currentManagerName,
      teamName: firstCurrentAsset.currentTeamName,
      rosterId: firstCurrentAsset.currentRosterId,
      holdings: visibleAssets.filter((asset) => asset.currentOwnerId === ownerId).sort(compareFutureAssets),
      tradedAway: visibleAssets.filter((asset) => asset.originalOwnerId === ownerId && asset.isTraded).sort(compareFutureAssets),
    };
  }).sort((a, b) => a.rosterId - b.rosterId);
}

function compareFutureAssets(a: FuturePickAsset, b: FuturePickAsset) {
  return a.round - b.round || Number(a.isTraded) - Number(b.isTraded) || a.originalRosterId - b.originalRosterId;
}

function FuturePickOwnerCard({ group }: { group: FuturePickOwnerGroup }) {
  return (
    <article className="rounded-xl border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface-raised)] p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-3 border-b border-[var(--lcc-color-border)] pb-4">
        <div className="min-w-0"><p className="lcc2-label text-[var(--lcc-brand-secondary)]">Manager</p><h3 className="mt-1 break-words font-ui text-lg font-black text-[var(--lcc-color-text)]">{group.managerName}</h3><p className="break-words font-ui text-sm font-semibold text-[var(--lcc-color-text-muted)]">{group.teamName}</p></div>
        <div className="shrink-0 rounded-lg bg-[var(--lcc-color-surface-muted)] px-3 py-2 text-right"><p className="font-ui text-lg font-black text-[var(--lcc-color-text)]">{group.holdings.length}</p><p className="font-ui text-[0.6rem] font-black uppercase tracking-[0.08em] text-[var(--lcc-color-text-muted)]">Picks held</p></div>
      </div>
      {group.holdings.length > 0 ? <div className="mt-3 grid grid-cols-2 gap-2">{group.holdings.map((asset) => <FuturePickChip key={asset.id} asset={asset} />)}</div> : <p className="mt-3 rounded-lg bg-[var(--lcc-color-surface-muted)] px-3 py-2 font-ui text-xs font-semibold text-[var(--lcc-color-text-muted)]">No assets in this round filter.</p>}
      {group.tradedAway.length > 0 && <div className="mt-3 border-t border-[var(--lcc-color-border)] pt-3"><p className="font-ui text-[0.62rem] font-black uppercase tracking-[0.08em] text-[var(--lcc-color-text-muted)]">Traded away</p><div className="mt-2 space-y-2">{group.tradedAway.map((asset) => <div key={asset.id} className="flex items-start gap-2 rounded-lg bg-[var(--lcc-color-surface-muted)] px-3 py-2"><ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-[var(--lcc-color-text-muted)]" aria-hidden="true" /><p className="font-ui text-xs font-bold text-[var(--lcc-color-text)]">R{asset.round} → {asset.currentManagerName}<span className="block font-semibold text-[var(--lcc-color-text-muted)]">{asset.currentTeamName}</span></p></div>)}</div></div>}
    </article>
  );
}

function FuturePickChip({ asset }: { asset: FuturePickAsset }) {
  const acquired = asset.isTraded && asset.currentOwnerId !== asset.originalOwnerId;
  return <div className={`rounded-lg border px-3 py-2 ${acquired ? 'border-[color-mix(in_srgb,var(--lcc-semantic-warning)_55%,var(--lcc-color-border))] bg-[color-mix(in_srgb,var(--lcc-semantic-warning)_10%,var(--lcc-color-surface-raised))]' : 'border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface)]'}`}><div className="flex items-start justify-between gap-2"><p className="font-ui text-base font-black text-[var(--lcc-color-text)]">R{asset.round}</p>{acquired && <GitCompareArrows className="h-4 w-4 text-[var(--lcc-semantic-warning)]" aria-label="Acquired asset" />}</div><p className="mt-1 font-ui text-[0.62rem] font-black uppercase tracking-[0.08em] text-[var(--lcc-color-text-muted)]">{acquired ? 'Acquired' : 'Own'}</p>{acquired && <p className="mt-1 break-words font-ui text-[0.68rem] font-bold leading-tight text-[var(--lcc-color-text-muted)]">From {asset.originalManagerName}<span className="block font-semibold">{asset.originalTeamName}</span></p>}</div>;
}

function FuturePickEvidence({ formatDerived }: { formatDerived: boolean }) {
  return <div className="flex max-w-xl items-start gap-3 rounded-lg border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface-raised)] px-3 py-3"><div className="mt-0.5 shrink-0 text-[var(--lcc-interactive)]">{formatDerived ? <CircleHelp className="h-5 w-5" aria-hidden="true" /> : <BadgeCheck className="h-5 w-5" aria-hidden="true" />}</div><div><p className="font-ui text-xs font-black uppercase tracking-[0.06em] text-[var(--lcc-color-text)]">{formatDerived ? 'Format-derived' : 'Sleeper verified'}</p><p className="mt-1 font-ui text-xs font-semibold leading-relaxed text-[var(--lcc-color-text-muted)]">{formatDerived ? '2028 assets are derived from the league’s verified 12-team, four-round rookie-draft format. Sleeper currently reports no direct 2028 traded-pick records.' : 'Current Sleeper state directly supports the displayed traded-pick ownership for this year.'}</p></div></div>;
}

function FutureRoundFilter({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return <button type="button" aria-pressed={selected} onClick={onClick} className={`min-h-9 rounded-md border px-3 py-2 font-ui text-xs font-black uppercase tracking-[0.04em] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lcc-interactive-focus)] ${selected ? 'border-[var(--lcc-interactive)] bg-[var(--lcc-interactive)] text-white' : 'border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface-raised)] text-[var(--lcc-color-text-muted)] hover:border-[var(--lcc-interactive)] hover:text-[var(--lcc-interactive)]'}`}>{label}</button>;
}

function DraftRecordsPanel() {
  const topRecords = getDraftRecordSummary();
  const rookieRecords = getRookieDraftRecords();
  const positionRecords = getPositionDraftRecords();
  const eraRecords = getEraDraftRecords();
  return (
    <DraftSection id="draft-panel-records" eyebrow="Canonical records" title="Draft Records" supporting="Descriptive records derived from verified 2019–2026 draft history. Manager identity and era context remain explicit." action={<Trophy className="h-5 w-5 text-[var(--lcc-brand-secondary)]" aria-hidden="true" />}>
      <section aria-labelledby="draft-records-top-heading">
        <RecordSectionHeading id="draft-records-top-heading" eyebrow="Top records" title="League records" supporting="All canonical events, with format context shown where the comparison matters." />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">{topRecords.map((record) => <DraftRecordCard key={record.recordId} record={record} />)}</div>
      </section>

      <section className="mt-8" aria-labelledby="draft-records-rookie-heading">
        <RecordSectionHeading id="draft-records-rookie-heading" eyebrow="Rookie era" title="Rookie Draft Records" supporting="2021–2026 rookie drafts only; startup and keeper selections are excluded." />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">{rookieRecords.map((record) => <DraftRecordCard key={record.recordId} record={record} />)}</div>
      </section>

      <section className="mt-8" aria-labelledby="draft-records-position-heading">
        <RecordSectionHeading id="draft-records-position-heading" eyebrow="Position frequency" title="Position Records" supporting="Exact selection counts are shown alongside each ranked bar." />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2"><PositionRecordList title="All canonical history" records={positionRecords.overall} valueKey="overall" /><PositionRecordList title="Rookie Draft Era" records={positionRecords.rookie} valueKey="rookie" /></div>
      </section>

      <section className="mt-8" aria-labelledby="draft-records-era-heading">
        <RecordSectionHeading id="draft-records-era-heading" eyebrow="Era context" title="Era Records" supporting="Keeper, startup, and rookie formats are presented as distinct contexts." />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">{eraRecords.map((record) => <DraftRecordCard key={record.recordId} record={record} />)}</div>
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface)] px-4 py-3"><CircleHelp className="mt-0.5 h-5 w-5 shrink-0 text-[var(--lcc-interactive)]" aria-hidden="true" /><p className="font-ui text-xs font-semibold leading-relaxed text-[var(--lcc-color-text-muted)]">Trade records reflect preserved Sleeper draft-pick lineage where available. Full transaction chronology is not available for every historical pick.</p></div>
      </section>
    </DraftSection>
  );
}

function RecordSectionHeading({ id, eyebrow, title, supporting }: { id: string; eyebrow: string; title: string; supporting: string }) {
  return <div className="mb-4"><p className="lcc2-label text-[var(--lcc-brand-secondary)]">{eyebrow}</p><h3 id={id} className="mt-1 font-ui text-xl font-black text-[var(--lcc-color-text)]">{title}</h3><p className="lcc2-body mt-1 text-sm">{supporting}</p></div>;
}

function DraftRecordCard({ record }: { record: DraftRecord }) {
  return <article className="rounded-xl border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface-raised)] p-4 shadow-[0_6px_18px_rgba(15,23,42,0.05)]"><p className="lcc2-label text-[var(--lcc-brand-secondary)]">{record.label}</p><div className="mt-2 flex items-end gap-2"><p className="font-ui text-3xl font-black tracking-[-0.04em] text-[var(--lcc-color-text)]">{record.value}</p><p className="mb-1 font-ui text-xs font-black uppercase tracking-[0.06em] text-[var(--lcc-color-text-muted)]">{record.unit}</p></div><p className="mt-2 font-ui text-xs font-bold text-[var(--lcc-color-text-muted)]">{record.era}</p>{record.holders.length > 0 && <div className="mt-3 space-y-1">{record.holders.map((holder) => <div key={holder.ownerId} className="font-ui text-sm font-black text-[var(--lcc-color-text)]">{holder.ownerName}<span className="block text-xs font-semibold text-[var(--lcc-color-text-muted)]">{holder.teamName}</span></div>)}</div>}{record.subjects.length > 0 && <div className="mt-3 space-y-1">{record.subjects.map((subject) => <div key={`${subject.season}-${subject.playerName}`} className="font-ui text-sm font-black text-[var(--lcc-color-text)]">{subject.playerName}<span className="block text-xs font-semibold text-[var(--lcc-color-text-muted)]">{subject.season} · {subject.ownerName ?? 'Historical owner unavailable'}</span></div>)}</div>}{record.notes && <p className="mt-3 border-t border-[var(--lcc-color-border)] pt-3 font-ui text-xs font-semibold text-[var(--lcc-color-text-muted)]">{record.notes}</p>}</article>;
}

function PositionRecordList({ title, records, valueKey }: { title: string; records: readonly DraftPositionRecord[]; valueKey: 'overall' | 'rookie' }) {
  const max = Math.max(...records.map((record) => record[valueKey]));
  return <div className="rounded-xl border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface-raised)] p-4"><h4 className="font-ui text-base font-black text-[var(--lcc-color-text)]">{title}</h4><div className="mt-4 space-y-3">{records.map((record) => <div key={record.position}><div className="flex items-center justify-between gap-3 font-ui text-xs font-black uppercase"><span className="text-[var(--lcc-color-text)]">{record.position}</span><span className="text-[var(--lcc-color-text-muted)]">{record[valueKey]}</span></div><div className="mt-1 h-2 rounded-full bg-[var(--lcc-color-surface-muted)]"><div className="h-2 rounded-full bg-[var(--lcc-interactive)]" style={{ width: `${(record[valueKey] / max) * 100}%` }} /></div></div>)}</div></div>;
}

function DraftResourcesPanel({ onNavigateTab }: { onNavigateTab: (value: DraftRoomTab) => void }) {
  return (
    <DraftSection id="draft-panel-resources" eyebrow="Draft toolkit" title="Draft Resources" supporting="League rules, draft history, rankings, research, and tools for draft preparation." action={<FileText className="h-5 w-5 text-[var(--lcc-brand-secondary)]" aria-hidden="true" />}>
      <div>
        <ResourceSubheading title="Your League" supporting="Canonical league destinations for draft planning and reference." />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <LinkResourceTile title="Draft Rules" description="Rookie draft timing, clock, format, and order rules." icon={<BookOpen className="h-5 w-5" aria-hidden="true" />} href="/league-info/constitution#h3" actionLabel="Open Draft Rules" />
          <ButtonResourceTile title="Draft History" description="Review canonical draft events, rounds, picks, and historical context." icon={<History className="h-5 w-5" aria-hidden="true" />} onClick={() => onNavigateTab('history')} actionLabel="View Draft History" />
          <ButtonResourceTile title="Future Picks" description="Inspect preserved future-pick inventory and current ownership." icon={<CalendarDays className="h-5 w-5" aria-hidden="true" />} onClick={() => onNavigateTab('future')} actionLabel="View Future Picks" />
          <ButtonResourceTile title="Draft Records" description="Explore selection, position, rookie, and era records." icon={<Trophy className="h-5 w-5" aria-hidden="true" />} onClick={() => onNavigateTab('records')} actionLabel="View Draft Records" />
        </div>
      </div>
      <div className="mt-8">
        <ResourceSubheading title="Draft Research" supporting="External rankings and draft-oriented research from the shared league resource directory." />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{getDraftResearchResources().map((resource) => <ExternalDraftResourceTile key={resource.id} resource={resource} />)}</div>
      </div>
      <div className="mt-8">
        <ResourceSubheading title="Tools & Analyzers" supporting="External tools for valuation, trade analysis, and draft preparation." />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{getDraftToolResources().map((resource) => <ExternalDraftResourceTile key={resource.id} resource={resource} />)}</div>
      </div>
      <div className="mt-8 border-t border-[var(--lcc-color-border)] pt-5">
        <Link href="/league-info/resources" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--lcc-color-border)] px-4 py-2 font-ui text-xs font-black uppercase tracking-[0.04em] text-[var(--lcc-interactive)] transition-colors hover:border-[var(--lcc-interactive)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lcc-interactive-focus)]">
          View All League Resources <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </DraftSection>
  );
}

function ResourceSubheading({ title, supporting }: { title: string; supporting: string }) {
  return <div className="mb-4"><h3 className="font-ui text-xl font-black text-[var(--lcc-color-text)]">{title}</h3><p className="lcc2-body mt-1 text-sm">{supporting}</p></div>;
}

function DraftResourceTile({ title, description, icon, actionLabel, children }: { title: string; description: string; icon: ReactNode; actionLabel: string; children: ReactNode }) {
  return <div className="h-full rounded-xl border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface-raised)] p-4 transition-colors hover:border-[var(--lcc-interactive)]"><div className="flex items-start justify-between gap-4"><div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface)] text-[var(--lcc-color-text-muted)]">{icon}</div>{children}</div><h4 className="mt-4 font-ui text-lg font-black text-[var(--lcc-color-text)]">{title}</h4><p className="lcc2-body mt-2 text-sm">{description}</p><span className="mt-4 inline-flex items-center gap-2 font-ui text-xs font-black uppercase text-[var(--lcc-interactive)]">{actionLabel}<ArrowUpRight className="h-4 w-4" aria-hidden="true" /></span></div>;
}

function LinkResourceTile({ title, description, icon, href, actionLabel }: { title: string; description: string; icon: ReactNode; href: string; actionLabel: string }) {
  return <Link href={href} className="block h-full rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lcc-interactive-focus)]"><DraftResourceTile title={title} description={description} icon={icon} actionLabel={actionLabel}><span className="lcc2-badge lcc2-badge--info">Internal</span></DraftResourceTile></Link>;
}

function ButtonResourceTile({ title, description, icon, onClick, actionLabel }: { title: string; description: string; icon: ReactNode; onClick: () => void; actionLabel: string }) {
  return <button type="button" onClick={onClick} className="block h-full w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lcc-interactive-focus)]"><DraftResourceTile title={title} description={description} icon={icon} actionLabel={actionLabel}><span className="lcc2-badge lcc2-badge--info">Internal</span></DraftResourceTile></button>;
}

function ExternalDraftResourceTile({ resource }: { resource: LeagueResource }) {
  return <a href={resource.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${resource.name} in a new tab`} className="block h-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lcc-interactive-focus)]"><DraftResourceTile title={resource.name} description={resource.description} icon={<BarChart3 className="h-5 w-5" aria-hidden="true" />} actionLabel="Open resource"><span className={`lcc2-badge ${resource.type === 'Premium' ? 'lcc2-badge--warning' : resource.type === 'Freemium' ? 'lcc2-badge--info' : 'lcc2-badge--neutral'}`}>{resource.type}</span></DraftResourceTile></a>;
}

function DraftSection({ id, eyebrow, title, supporting, action, className = '', children }: { id?: string; eyebrow: string; title: string; supporting?: string; action?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <section id={id} className={`lcc2-card p-0 ${className}`} role={id ? 'tabpanel' : undefined} aria-labelledby={id?.startsWith('draft-panel-') ? `draft-tab-${id.replace('draft-panel-', '')}` : undefined}>
      <div className="flex flex-col gap-3 border-b border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface-muted)] px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
        <div><p className="lcc2-section-heading__eyebrow">{eyebrow}</p><h2 className="lcc2-section-heading__title">{title}</h2>{supporting && <p className="lcc2-section-heading__supporting">{supporting}</p>}</div>{action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function DraftMetricCard({ icon, label, value, helperText, status }: { icon: ReactNode; label: string; value: string; helperText: string; status: 'Available' | 'TBD' }) {
  return (
    <article className="lcc2-metric-card">
      <div className="flex items-start justify-between gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--lcc-color-surface-muted)] text-[var(--lcc-brand-secondary)]">{icon}</div><StatusBadge label={status} /></div>
      <p className="lcc2-metric-card__label mt-4">{label}</p><p className="lcc2-metric-card__value">{value}</p><p className="lcc2-metric-card__helper mt-2">{helperText}</p>
    </article>
  );
}

function DraftDetail({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return <div className="rounded-lg border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface)] p-3"><dt className="lcc2-label">{label}</dt><dd className={`mt-2 font-ui text-sm font-black ${muted ? 'text-[var(--lcc-color-text-muted)]' : 'text-[var(--lcc-color-text)]'}`}>{value}</dd></div>;
}

function StatusBadge({ label }: { label: string }) {
  const tone = label === 'Available' ? 'lcc2-badge--info' : 'lcc2-badge--neutral';
  return <span className={`lcc2-badge ${tone}`}>{label}</span>;
}

function formatEra(era: 'two-keeper' | 'dynasty') {
  return era === 'two-keeper' ? 'Two-Keeper Era' : 'Dynasty Era';
}

function formatDraftEra(era: DraftEventData['era']) {
  if (era === 'sleeper-keeper') return 'Sleeper Keeper Era';
  if (era === 'dynasty-transition-startup') return 'Dynasty Transition';
  if (era === 'current-operational') return 'Current Draft Cycle';
  return 'Dynasty Rookie Drafts';
}

function getDraftTypeLabel(draft: DraftEventData) {
  if (draft.draftType === 'dynasty-startup') return 'Dynasty Startup Draft';
  if (draft.draftType === 'keeper-veteran') return 'Keeper / Veteran Draft';
  return 'Rookie Draft';
}

function formatDraftDate(timestamp: number | null) {
  if (!timestamp) return 'Date unavailable';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(timestamp);
}

function formatDraftOwner(canonicalOwnerId: string | null, sleeperUserId: string | null) {
  const owner = canonicalOwnerId ? getLccOwnerById(canonicalOwnerId) : undefined;
  if (owner) return `${owner.displayName} · ${owner.managerPage.sleeperName}`;
  return sleeperUserId ?? 'Unresolved';
}
