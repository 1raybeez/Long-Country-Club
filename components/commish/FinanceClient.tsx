'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import type { CommissionerFinanceSnapshot, CommissionerFinanceRow } from '@/lib/finance/operationalLedger';

export function FinanceClient({ initialSnapshot }: { initialSnapshot: CommissionerFinanceSnapshot | null }) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function initialize() {
    setBusy(true); setMessage('');
    const response = await fetch('/api/commish/finance/initialize', { method: 'POST' });
    const payload = await response.json();
    setBusy(false);
    if (!response.ok) { setMessage(payload.error ?? 'Unable to initialize ledger.'); return; }
    window.location.reload();
  }

  async function refresh() {
    setBusy(true); setMessage('');
    window.location.reload();
  }

  if (!snapshot?.initialized) {
    return <section className="lcc2-card mt-6 p-5 sm:p-6"><p className="lcc2-label text-[var(--lcc-brand-secondary)]">Operational ledger</p><h2 className="mt-2 font-ui text-2xl font-black text-[var(--lcc-color-text)]">Not initialized</h2><p className="lcc2-body mt-2">The idempotent setup creates 12 approved $50 assessments, the verified ring expense, and restricted reserve metadata. It creates no payments.</p><button type="button" onClick={initialize} disabled={busy} className="lcc2-button lcc2-button--primary mt-5">{busy ? 'Initializing…' : 'Initialize 2026 Ledger'}</button>{message && <p role="alert" className="lcc2-body mt-3 text-[var(--lcc-semantic-warning)]">{message}</p>}</section>;
  }

  const paid = snapshot.rows.filter((row) => row.status === 'paid').length;
  const partial = snapshot.rows.filter((row) => row.status === 'partial').length;
  const unpaid = snapshot.rows.filter((row) => row.status === 'unpaid').length;
  return <>
    <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Assessed" value={money(snapshot.assessedCents)} /><Metric label="Collected" value={money(snapshot.collectedCents)} /><Metric label="Outstanding" value={money(snapshot.outstandingCents)} /><Metric label="Status" value={`${paid} paid · ${partial} partial · ${unpaid} unpaid`} /></div>
    <div className="mt-4 flex items-center justify-between gap-3"><p className="lcc2-body">Payments are append-only. Corrections require a protected reversal/replacement workflow.</p><button type="button" onClick={refresh} disabled={busy} className="lcc2-button lcc2-button--secondary"><RefreshCw className="h-4 w-4" aria-hidden="true" />Refresh</button></div>
    <div className="mt-6 grid grid-cols-1 gap-3">{snapshot.rows.map((row) => <FinanceRow key={row.ownerId} row={row} onComplete={refresh} setMessage={setMessage} />)}</div>
    {message && <p role="status" className="lcc2-body mt-4 text-[var(--lcc-brand-secondary)]">{message}</p>}
  </>;
}

function FinanceRow({ row, onComplete, setMessage }: { row: CommissionerFinanceRow; onComplete: () => Promise<void>; setMessage: (message: string) => void }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState((row.remainingCents / 100).toFixed(2));
  const [method, setMethod] = useState('venmo');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);
  const [requestId] = useState(() => crypto.randomUUID());
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage('');
    const response = await fetch('/api/commish/finance/payments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ownerId: row.ownerId, amountCents: Math.round(Number(amount) * 100), paymentMethod: method, effectiveDate: date, requestId }) });
    const payload = await response.json(); setBusy(false);
    if (!response.ok) { setMessage(payload.error ?? 'Payment was not recorded.'); return; }
    setOpen(false); setMessage(`Payment recorded for ${row.displayName}.`); await onComplete();
  }
  return <article className="lcc2-card p-4 sm:p-5"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><p className="font-ui text-base font-black text-[var(--lcc-color-text)]">{row.displayName}</p><p className="lcc2-body mt-1">{row.teamName} · Assessed {money(row.assessedCents)} · Settled {money(row.settledCents)} · Remaining {money(row.remainingCents)}</p></div><div className="flex items-center gap-3"><span className={`lcc2-badge ${row.status === 'paid' ? 'lcc2-badge--info' : row.status === 'partial' ? 'lcc2-badge--warning' : 'lcc2-badge--neutral'}`}>{row.status}</span>{row.remainingCents > 0 ? <button type="button" onClick={() => setOpen((value) => !value)} className="lcc2-button lcc2-button--secondary">{open ? 'Close' : 'Record Payment'}</button> : null}</div></div>{row.payments.length ? <div className="mt-3 border-t border-[var(--lcc-color-border)] pt-3">{row.payments.map((payment) => <p key={payment.paymentId} className="font-ui text-xs font-bold text-[var(--lcc-color-text-muted)]">{money(payment.amountCents)} · {payment.paymentMethod} · {payment.effectiveDate}</p>)}</div> : null}{open ? <form onSubmit={submit} className="mt-4 grid grid-cols-1 gap-3 border-t border-[var(--lcc-color-border)] pt-4 sm:grid-cols-3"><label className="font-ui text-xs font-black uppercase tracking-wider text-[var(--lcc-color-text-muted)]">Amount<input required min="0.01" max={(row.remainingCents / 100).toFixed(2)} step="0.01" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-[var(--lcc-color-border-strong)] bg-[var(--lcc-color-surface-raised)] px-3 text-sm text-[var(--lcc-color-text)]" /></label><label className="font-ui text-xs font-black uppercase tracking-wider text-[var(--lcc-color-text-muted)]">Payment method<select value={method} onChange={(event) => setMethod(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-[var(--lcc-color-border-strong)] bg-[var(--lcc-color-surface-raised)] px-3 text-sm text-[var(--lcc-color-text)]"><option value="venmo">Venmo</option><option value="paypal">PayPal</option><option value="other">Other</option></select></label><label className="font-ui text-xs font-black uppercase tracking-wider text-[var(--lcc-color-text-muted)]">Payment date<input required type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-[var(--lcc-color-border-strong)] bg-[var(--lcc-color-surface-raised)] px-3 text-sm text-[var(--lcc-color-text)]" /></label><button type="submit" disabled={busy} className="lcc2-button lcc2-button--primary sm:col-span-3">{busy ? 'Recording…' : 'Confirm Payment'}</button></form> : null}</article>;
}

function Metric({ label, value }: { label: string; value: string }) { return <article className="lcc2-metric-card"><p className="lcc2-metric-card__label">{label}</p><p className="lcc2-metric-card__value">{value}</p></article>; }
function money(cents: number) { return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
