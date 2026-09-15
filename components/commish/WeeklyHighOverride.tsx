'use client';

import { useState } from 'react';
import type { WeeklyHighResult } from '@/lib/finance/weeklyHigh';
import { ACTIVE_LCC_OWNERS } from '@/lib/lccOwners';

export function WeeklyHighOverride({ board, season }: { board: readonly WeeklyHighResult[]; season: number }) {
  const [message, setMessage] = useState('');
  const [busyWeek, setBusyWeek] = useState<number | null>(null);
  return <section className="mt-8 rounded-xl border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface)] p-4 sm:p-5"><p className="lcc2-label">Commissioner control</p><h3 className="mt-1 font-ui text-xl font-black text-[var(--lcc-color-text)]">Weekly-high override</h3><p className="lcc2-body mt-2">Use only for a documented tie, stat correction, or Sleeper data issue. Automatic results are not written on page view.</p><div className="mt-4 space-y-3">{board.map((item) => <OverrideRow key={item.week} season={season} item={item} busy={busyWeek === item.week} onBusy={setBusyWeek} onMessage={setMessage} />)}</div>{message ? <p role="status" className="lcc2-body mt-3 text-[var(--lcc-semantic-warning)]">{message}</p> : null}</section>;
}

function OverrideRow({ season, item, busy, onBusy, onMessage }: { season: number; item: WeeklyHighResult; busy: boolean; onBusy: (week: number | null) => void; onMessage: (message: string) => void }) {
  const [franchiseId, setFranchiseId] = useState(item.franchiseId ?? ACTIVE_LCC_OWNERS[0]?.id ?? '');
  const [score, setScore] = useState(item.score?.toFixed(2) ?? '');
  const [note, setNote] = useState(item.note ?? '');
  async function save(action: 'override' | 'revert') {
    onBusy(item.week); onMessage('');
    const response = await fetch('/api/commish/finance/awards/weekly-high-override', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(action === 'revert' ? { action, season, week: item.week } : { season, week: item.week, franchiseId, score: Number(score), note }) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) onMessage(payload.error ?? 'Weekly-high override failed.'); else window.location.reload();
    onBusy(null);
  }
  return <div className="grid gap-3 rounded-lg border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface-muted)] p-3 lg:grid-cols-[auto_minmax(0,1fr)_9rem_minmax(0,1fr)_auto_auto]"><div><p className="lcc2-label">Week {item.week}</p><p className="lcc2-body mt-1">{item.franchiseName ?? 'No automatic winner'} · {item.score?.toFixed(2) ?? '—'} · {item.status}</p></div><label className="block"><span className="lcc2-label">Franchise</span><select value={franchiseId} onChange={(event) => setFranchiseId(event.target.value)} className="mt-1 min-h-9 w-full rounded-md border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface-raised)] px-2 text-sm text-[var(--lcc-color-text)]">{ACTIVE_LCC_OWNERS.map((owner) => <option key={owner.id} value={owner.id}>{owner.managerPage.sleeperName}</option>)}</select></label><label className="block"><span className="lcc2-label">Score</span><input type="number" min="0" max="1000" step="0.01" value={score} onChange={(event) => setScore(event.target.value)} className="mt-1 min-h-9 w-full rounded-md border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface-raised)] px-2 text-sm text-[var(--lcc-color-text)]" /></label><label className="block"><span className="lcc2-label">Note</span><input maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} className="mt-1 min-h-9 w-full rounded-md border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface-raised)] px-2 text-sm text-[var(--lcc-color-text)]" /></label><button type="button" disabled={busy || !score} onClick={() => save('override')} className="lcc2-button lcc2-button--primary">{busy ? 'Saving…' : 'Save override'}</button><button type="button" disabled={busy || item.source !== 'commissioner-override'} onClick={() => save('revert')} className="lcc2-button lcc2-button--secondary">Revert</button></div>;
}
