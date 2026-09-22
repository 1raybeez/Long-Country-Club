import Link from 'next/link';
import { AlertCircle, ArrowLeft, Banknote, BrainCircuit, CheckCircle2, ChevronDown, Clock3, Home, MessageSquare, ShieldCheck } from 'lucide-react';
import { redirect } from 'next/navigation';
import { getCurrentMemberSession } from '@/lib/auth/session';
import { getCommissionerHubModel } from '@/lib/commissionerHub/model';
import type { AttentionItem, OperationalBlocker, WeeklyOperations } from '@/lib/commissionerHub/types';

export const dynamic = 'force-dynamic';

export default async function CommissionerHubPage() {
  const session = await getCurrentMemberSession();
  if (!session?.member?.capabilities.includes('commissioner')) redirect('/?access=commissioner-required');
  const model = await getCommissionerHubModel();
  const warRoom = model.capabilities.find((capability) => capability.id === 'WAR_ROOM');

  return (
    <main className="lcc2-page-shell">
      <div className="lcc2-page-container">
        <Link href="/" className="lcc2-button lcc2-button--secondary"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Return to LCC Home</Link>
        <header className="mt-8 max-w-3xl">
          <p className="lcc2-label text-[var(--lcc-brand-primary)]">Commissioner Operations</p>
          <h1 className="mt-2 font-ui text-4xl font-black tracking-[-0.04em] text-[var(--lcc-color-text)] sm:text-5xl">Commissioner Hub</h1>
          <p className="lcc2-body mt-3">{model.leagueIdentity.name} · {model.leagueIdentity.season} season · {formatWeek(model.weeklyOperations.week)}</p>
          <p className="lcc2-body mt-1">Private tools for league operations, finance, feedback, and administration.</p>
        </header>

        <section className="mt-8" aria-labelledby="needs-attention-heading">
          <div className="mb-4"><p className="lcc2-label text-[var(--lcc-brand-secondary)]">Needs attention</p><h2 id="needs-attention-heading" className="mt-1 font-ui text-2xl font-black text-[var(--lcc-color-text)]">Commissioner action</h2></div>
          <AttentionPanel items={model.attentionItems} />
        </section>

        <section className="mt-10" aria-labelledby="weekly-operations-heading">
          <div className="mb-4"><p className="lcc2-label text-[var(--lcc-brand-primary)]">Weekly operations</p><h2 id="weekly-operations-heading" className="mt-1 font-ui text-2xl font-black text-[var(--lcc-color-text)]">League state at a glance</h2></div>
          <WeeklyOperationsPanel operations={model.weeklyOperations} />
        </section>

        <section className="mt-10" aria-labelledby="active-tools-heading">
          <div className="mb-4"><p className="lcc2-label text-[var(--lcc-brand-primary)]">Active tools</p><h2 id="active-tools-heading" className="mt-1 font-ui text-2xl font-black text-[var(--lcc-color-text)]">Private operations</h2></div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <HubCard href="/commish/feedback" eyebrow="Owner Feedback" title="Feedback Queue" description="Review owner-submitted bugs and suggestions with private commissioner controls." icon={<MessageSquare aria-hidden="true" />} cta="Open queue" />
            <HubCard href="/commish/finance" eyebrow="2026 Finance" title="Finance" description="Manage league assessments, payments, awards, settlements, corrections, and reconciliation." icon={<Banknote aria-hidden="true" />} cta="Open finance" />
            {warRoom?.visibility === 'VISIBLE' && warRoom.route ? <HubCard href={warRoom.route} eyebrow="War Room" title="Owner workspace" description="Open the authenticated owner workspace with current roster and verified draft-capital modules." icon={<ShieldCheck aria-hidden="true" />} cta="Open War Room" /> : null}
          </div>
        </section>

        <section className="mt-10" aria-labelledby="future-tools-heading">
          <div className="mb-4"><p className="lcc2-label text-[var(--lcc-color-text-muted)]">Future roadmap</p><h2 id="future-tools-heading" className="mt-1 font-ui text-2xl font-black text-[var(--lcc-color-text)]">Not active yet</h2></div>
          <div className="max-w-xl"><FutureCard eyebrow="Post-Draft Intelligence" title="Coming later" description="Post-draft analysis is not enabled as a commissioner tool yet." icon={<BrainCircuit aria-hidden="true" />} /></div>
        </section>

        <Link href="/" className="mt-8 inline-flex font-ui text-xs font-black uppercase tracking-[0.1em] text-[var(--lcc-interactive)] hover:underline"><Home className="mr-2 h-4 w-4" aria-hidden="true" />Return to public site</Link>
      </div>
    </main>
  );
}

function AttentionPanel({ items }: { items: readonly AttentionItem[] }) {
  if (!items.length) return <div className="lcc2-card flex items-center gap-3 border-[var(--lcc-semantic-success)] p-5" role="status"><CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--lcc-semantic-success)]" aria-hidden="true" /><div><p className="font-ui font-black text-[var(--lcc-color-text)]">All caught up</p><p className="lcc2-body mt-1">No commissioner action required.</p></div></div>;
  return <div className="grid gap-3">{items.map((item) => <article key={item.id} className="lcc2-card p-4 sm:p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="flex min-w-0 gap-3"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--lcc-semantic-warning)]" aria-hidden="true" /><div><div className="flex flex-wrap items-center gap-2"><p className="lcc2-label">{item.sourceCapability.replaceAll('_', ' ')}</p><span className="lcc2-badge lcc2-badge--warning">{item.actionType}</span></div><h3 className="mt-2 font-ui text-lg font-black text-[var(--lcc-color-text)]">{item.title}</h3><p className="lcc2-body mt-1">{item.description}</p>{item.amount !== undefined ? <p className="mt-2 font-ui text-sm font-black text-[var(--lcc-color-text)]">${item.amount.toFixed(2)}</p> : null}</div></div>{item.destination ? <Link href={item.destination} className="lcc2-button lcc2-button--secondary shrink-0">{item.ctaLabel}</Link> : null}</div></article>)}</div>;
}

function WeeklyOperationsPanel({ operations }: { operations: WeeklyOperations }) {
  return <article className="lcc2-card lcc2-card--raised p-5 sm:p-6"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><OperationMetric label="Season" value={String(operations.season)} /><OperationMetric label="Current week" value={formatWeek(operations.week)} /><OperationMetric label="Lifecycle" value={operations.lifecycle} /><OperationMetric label="Freshness" value={operations.freshness ?? 'Unknown'} /></div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><OperationStatus label="Matchups" value={operations.matchupState ?? 'Unknown'} /><OperationStatus label="Finalization" value={operations.finalizationState ?? 'Unknown'} /><OperationStatus label="Weekly award" value={operations.awardState ?? 'Unknown'} /><OperationStatus label="Standings" value={operations.standingsState ?? 'Unknown'} /></div><details className="group mt-5 border-t border-[var(--lcc-color-border)] pt-4"><summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-ui text-sm font-black uppercase tracking-[0.06em] text-[var(--lcc-interactive)]"><span>More operational detail</span><ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden="true" /></summary><div className="mt-4 grid gap-3 sm:grid-cols-2"><OperationStatus label="Latest safely completed week" value={formatWeek(operations.latestSafelyCompletedWeek)} /><OperationStatus label="Rankings" value={operations.rankingsState ?? 'Unknown'} /><OperationStatus label="Predictor" value={operations.predictorState ?? 'Unknown'} /><OperationStatus label="Automation health" value={operations.automationHealth ?? 'Unknown'} /><OperationStatus label="Phase" value={operations.phase} /><OperationStatus label="Recap" value={operations.recapState} /><OperationStatus label="Postseason" value={operations.postseasonState} /></div><div className="mt-5"><p className="lcc2-label">Operational blockers</p>{operations.blockers.length ? <div className="mt-2 grid gap-2">{operations.blockers.map((blocker) => <BlockerRow key={blocker.code} blocker={blocker} />)}</div> : <p className="lcc2-body mt-2">No operational blockers reported.</p>}</div></details></article>;
}

function BlockerRow({ blocker }: { blocker: OperationalBlocker }) {
  return <div className="rounded-lg border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface)] p-3"><div className="flex items-start gap-2"><Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--lcc-color-text-muted)]" aria-hidden="true" /><div><p className="font-ui text-sm font-black text-[var(--lcc-color-text)]">{blocker.title}</p><p className="lcc2-body mt-1 text-sm">{blocker.description}</p><p className="mt-2 font-ui text-xs font-bold uppercase tracking-[0.06em] text-[var(--lcc-color-text-muted)]">{blocker.requiresHumanAction ? 'Human action may be required' : 'Operational blocker only'}</p></div></div></div>;
}

function OperationMetric({ label, value }: { label: string; value: string }) { return <div className="lcc2-metric-card"><p className="lcc2-metric-card__label">{label}</p><p className="lcc2-metric-card__value">{value}</p></div>; }
function OperationStatus({ label, value }: { label: string; value: string }) { return <div className="rounded-lg border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface)] p-3"><p className="lcc2-label">{label}</p><p className="mt-1 font-ui text-sm font-black text-[var(--lcc-color-text)]">{value}</p></div>; }
function formatWeek(week: number | null) { return week === null ? 'Unavailable' : `Week ${week}`; }

function HubCard({ href, eyebrow, title, description, icon, cta }: { href: string; eyebrow: string; title: string; description: string; icon: React.ReactNode; cta: string }) {
  return <Link href={href} className="lcc2-card lcc2-card--interactive block p-5"><div className="flex items-start justify-between gap-4"><div><p className="lcc2-label text-[var(--lcc-brand-secondary)]">{eyebrow}</p><h3 className="mt-2 font-ui text-2xl font-black text-[var(--lcc-color-text)]">{title}</h3></div><span className="text-[var(--lcc-brand-secondary)]">{icon}</span></div><p className="lcc2-body mt-4">{description}</p><span className="mt-5 inline-flex font-ui text-xs font-black uppercase tracking-[0.12em] text-[var(--lcc-interactive)]">{cta} →</span></Link>;
}

function FutureCard({ eyebrow, title, description, icon }: { eyebrow: string; title: string; description: string; icon: React.ReactNode }) {
  return <article className="lcc2-card p-5 opacity-75"><div className="flex items-start justify-between gap-4"><div><p className="lcc2-label text-[var(--lcc-color-text-muted)]">{eyebrow}</p><h3 className="mt-2 font-ui text-2xl font-black text-[var(--lcc-color-text)]">{title}</h3></div><span className="text-[var(--lcc-color-text-muted)]">{icon}</span></div><p className="lcc2-body mt-4">{description}</p><span className="mt-5 inline-flex font-ui text-xs font-black uppercase tracking-[0.12em] text-[var(--lcc-color-text-muted)]">Not active</span></article>;
}
