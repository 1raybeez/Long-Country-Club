'use client';

import { useState } from 'react';
import type { WeeklyHighResult } from '@/lib/finance/weeklyHigh';
import { ACTIVE_LCC_OWNERS } from '@/lib/lccOwners';

export function WeeklyHighOverride({ board, season }: { board: readonly WeeklyHighResult[]; season: number }) {
  const [message, setMessage] = useState('');
  const [busyWeek, setBusyWeek] = useState<number | null>(null);
  return <section className="mt-8 rounded-xl border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface)] p-4 sm:p-5"><p className="lcc2-label">Commissioner control</p><h3 className="mt-1 font-ui text-xl font-black text-[var(--lcc-color-text)]">Weekly-high override</h3><p className="lcc2-body mt-2">Automatic Sleeper results are read-only. For a tie, select the franchise Sleeper names in its official weekly report; the $10 is not split. Use manual entry only for that confirmation, a stat correction, or a documented data issue.</p><div className="mt-4 space-y-3">{board.map((item) => <OverrideRow key={item.week} season={season} item={item} busy={busyWeek === item.week} onBusy={setBusyWeek} onMessage={setMessage} />)}</div>{message ? <p role="status" className="lcc2-body mt-3 text-[var(--lcc-semantic-warning)]">{message}</p> : null}</section>;
}

function OverrideRow({ season, item, busy, onBusy, onMessage }: { season: number; item: WeeklyHighResult; busy: boolean; onBusy: (week: number | null) => void; onMessage: (message: string) => void }) {
  const existingOverride = item.source === 'commissioner-override';
  const automaticResult = item.source === 'sleeper' && !item.tie && item.franchiseId !== null && item.score !== null;
  const [manualMode, setManualMode] = useState(existingOverride);
  const [franchiseId, setFranchiseId] = useState(existingOverride || automaticResult ? item.franchiseId ?? '' : '');
  const [score, setScore] = useState(existingOverride || automaticResult ? item.score?.toFixed(2) ?? '' : '');
  const [note, setNote] = useState(item.note ?? '');
  const validScore = score.trim() !== '' && Number.isFinite(Number(score)) && Number(score) >= 0 && Number(score) <= 1000;
  const canSave = manualMode && franchiseId !== '' && validScore && note.trim().length >= 3;
  async function save(action: 'override' | 'revert') {
    onBusy(item.week); onMessage('');
    const response = await fetch('/api/commish/finance/awards/weekly-high-override', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(action === 'revert' ? { action, season, week: item.week } : { season, week: item.week, franchiseId, score: Number(score), note: note.trim() }) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) onMessage(payload.error ?? 'Weekly-high override failed.'); else window.location.reload();
    onBusy(null);
  }
  return <div className="grid gap-3 rounded-lg border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface-muted)] p-3 lg:grid-cols-[minmax(10rem,1.1fr)_minmax(11rem,1fr)_8rem_minmax(11rem,1fr)_auto_auto]"><div><p className="lcc2-label">Week {item.week}</p><p className="lcc2-body mt-1">{automaticResult ? `Automatic Sleeper result · ${item.franchiseName} · ${item.score?.toFixed(2)}` : item.tie ? 'Tie · Sleeper report confirmation needed' : existingOverride ? `${item.franchiseName ?? 'Confirmed franchise'} · ${item.score?.toFixed(2)}` : 'Pending'}</p></div><label className="block"><span className="lcc2-label">Franchise</span><select disabled={!manualMode || busy} value={franchiseId} onChange={(event) => setFranchiseId(event.target.value)} className="mt-1 min-h-9 w-full rounded-md border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface-raised)] px-2 text-sm text-[var(--lcc-color-text)]"><option value="">Select franchise</option>{ACTIVE_LCC_OWNERS.map((owner) => <option key={owner.id} value={owner.id}>{owner.managerPage.sleeperName}</option>)}</select></label><label className="block"><span className="lcc2-label">Score</span><input disabled={!manualMode || busy} type="number" min="0" max="1000" step="0.01" value={score} onChange={(event) => setScore(event.target.value)} className="mt-1 min-h-9 w-full rounded-md border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface-raised)] px-2 text-sm text-[var(--lcc-color-text)]" /></label><label className="block"><span className="lcc2-label">Reason / source note</span><input disabled={!manualMode || busy} maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Required to confirm" className="mt-1 min-h-9 w-full rounded-md border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface-raised)] px-2 text-sm text-[var(--lcc-color-text)]" /></label><button type="button" disabled={busy || (manualMode && !canSave)} onClick={() => manualMode ? save('override') : setManualMode(true)} className="lcc2-button lcc2-button--primary">{busy ? 'Saving…' : manualMode ? 'Save override' : automaticResult ? 'Override this result' : 'Enter manual result'}</button><button type="button" disabled={busy || !existingOverride} onClick={() => save('revert')} className="lcc2-button lcc2-button--secondary">Revert</button></div>;
}
