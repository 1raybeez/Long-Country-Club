'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Award,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  FileWarning,
  History,
  Landmark,
  Medal,
  Receipt,
  ShieldCheck,
  Trophy,
  WalletCards,
} from 'lucide-react';
import { getFinancialRules, LCC_RESTRICTED_VACU_RESERVE_CENTS } from '@/lib/financeRules';
import {
  getLeagueFinancialSummary,
  getSeasonFinance,
  getSeasonReconciliation,
  loadAllSeasonFinancialData,
} from '@/lib/history/financial';
import {
  getPublicCurrentSeasonFinance,
  getPublicSeasonFinance,
} from '@/lib/history/financialProjections';
import type { AwardRecord, ReconciliationStatus, SeasonFinancialData } from '@/lib/types/financial';
import type { PublicOperationalFinance } from '@/lib/types/operationalFinance';
import { LCC_CURRENT_SEASON } from '@/lib/leagueConstants';
import { LeagueInfoShell } from '@/components/league/LeagueInfoShell';

const HISTORICAL_SEASONS = [
  2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014,
] as const;

const RULES = getFinancialRules();

export default function LeaguePayoutsPage() {
  const [selectedSeason, setSelectedSeason] = useState<number>(HISTORICAL_SEASONS[0]);
  const currentFinanceBase = getPublicCurrentSeasonFinance();
  const [operationalFinance, setOperationalFinance] = useState<PublicOperationalFinance | null>(null);
  useEffect(() => {
    fetch('/api/finance/public')
      .then((response) => response.ok ? response.json() : null)
      .then((finance: PublicOperationalFinance | null) => { if (finance) setOperationalFinance(finance); })
      .catch(() => undefined);
  }, []);
  const currentFinance = currentFinanceBase && operationalFinance ? {
    ...currentFinanceBase,
    duesAssessed: operationalFinance.duesAssessed,
    duesCollected: operationalFinance.duesCollected,
    duesOutstanding: operationalFinance.duesOutstanding,
    ownerPaymentStatuses: operationalFinance.ownerPaymentStatuses.map((owner) => ({ managerId: owner.ownerId, managerName: owner.displayName, paymentStatus: owner.paymentStatus })),
  } : currentFinanceBase;
  const selectedFinance = getSeasonFinance(selectedSeason);
  const historicalFinance = loadAllSeasonFinancialData().filter(
    (season) => season.season <= LCC_CURRENT_SEASON - 1
  );
  const overall = getLeagueFinancialSummary(historicalFinance);
  const reconciledSeasons = historicalFinance.filter(
    (season) => getSeasonReconciliation(season.season).status === 'reconciled'
  ).length;
  const discrepancySeasons = historicalFinance.filter(
    (season) => getSeasonReconciliation(season.season).status === 'documented-discrepancy'
  ).length;

  const selectedProjection = selectedFinance ? getPublicSeasonFinance(selectedFinance) : null;
  const selectedAwards = selectedFinance ? getAwardCategories(selectedFinance) : [];
  const selectedReconciliation = getSeasonReconciliation(selectedSeason);

  return (
    <LeagueInfoShell>
      <main className="lcc2-page-shell">
      <div className="lcc2-page-container">
        <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="lcc2-label text-[var(--lcc-brand-primary)]">Payouts</p>
            <h1 className="mt-2 font-ui text-4xl font-black tracking-[-0.04em] text-[var(--lcc-color-text)] sm:text-5xl">
              League Payouts
            </h1>
            <p className="lcc2-body mt-3 max-w-2xl">
              League fee rules, payout structure, current-season accounting, and recorded financial history.
            </p>
          </div>
          <div className="lcc2-badge lcc2-badge--info self-start lg:self-end">
            Official LCC Financial Ledger
          </div>
        </header>

        <PayoutSection
          eyebrow={`${LCC_CURRENT_SEASON} Current Season`}
          title="Current financial status"
          supporting="Public aggregate information only. Owner-level settlement details remain private."
          action={<Landmark className="h-5 w-5 text-[var(--lcc-brand-secondary)]" aria-hidden="true" />}
          className="mb-6"
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <PayoutMetric label="Dues Assessed" value={formatAmount(currentFinance?.duesAssessed)} icon={<Receipt className="h-5 w-5" aria-hidden="true" />} />
            <PayoutMetric label="Dues Collected" value={formatAmount(currentFinance?.duesCollected)} helper={currentFinance?.duesCollected == null ? 'Not yet recorded' : undefined} icon={<CircleDollarSign className="h-5 w-5" aria-hidden="true" />} />
            <PayoutMetric label="Dues Outstanding" value={formatAmount(currentFinance?.duesOutstanding)} helper={currentFinance?.duesOutstanding == null ? 'Not yet recorded' : undefined} icon={<WalletCards className="h-5 w-5" aria-hidden="true" />} />
          </div>
          {currentFinance ? <DuesStatusList statuses={currentFinance.ownerPaymentStatuses} /> : null}
          <div className="mt-4 flex flex-col gap-3 rounded-xl border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface-muted)] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="lcc2-label text-[var(--lcc-brand-secondary)]">Season status</p>
              <p className="lcc2-body mt-1">2026 financial records are initialized, but commissioner settlement data has not yet been reconciled.</p>
            </div>
            <StatusBadge status={currentFinance?.reconciliation.status ?? 'pending'} />
          </div>
          {currentFinance?.leagueExpenses ? (
            <div className="mt-4 rounded-xl border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface-raised)] p-4 sm:p-5">
              <p className="lcc2-label text-[var(--lcc-brand-secondary)]">2026 Verified League Expenses</p>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <RuleCard label="Championship Ring" value={formatMoney(currentFinance.actualRingCost)} />
                <RuleCard label="Ring Reserve" value={`Up to ${formatMoney(currentFinance.ringReserveMaximum)}`} />
                <RuleCard label="Unused Reserve" value={formatMoney(currentFinance.unusedRingReserve)} />
                <RuleCard label="Projected Champion Allocation" value={formatMoney(currentFinance.projectedChampionCashAllocation)} helper="Projected; no recipient recorded" />
              </div>
            </div>
          ) : null}
          <div className="mt-4 rounded-xl border border-dashed border-[var(--lcc-color-border-strong)] bg-[var(--lcc-color-surface-muted)] p-4">
            <p className="lcc2-label text-[var(--lcc-brand-secondary)]">Where League Funds Are Held</p>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <RuleCard label="Restricted Reserve · VACU" value={`$${(LCC_RESTRICTED_VACU_RESERVE_CENTS / 100).toLocaleString()}`} helper="Future-Season Deposits" />
              <RuleCard label="Operating Funds" value="Current operating funds" helper="Balances not yet derived" />
            </div>
          </div>
        </PayoutSection>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <PayoutSection
            eyebrow="League rules"
            title="Fee rules"
            supporting="Current Constitution-backed amounts."
            action={<ShieldCheck className="h-5 w-5 text-[var(--lcc-brand-secondary)]" aria-hidden="true" />}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <RuleCard label="Annual League Fee" value={formatMoney(RULES.entryFee)} />
              <RuleCard label="New Owner Year 1" value={formatMoney(RULES.newOwnerFee)} />
              <RuleCard label="Future-Season Deposit" value={formatMoney(RULES.futureDeposit)} />
            </div>
            <p className="lcc2-body mt-4">A new owner&apos;s $75 Year 1 amount includes $50 current-year dues plus a $25 future-season deposit.</p>
          </PayoutSection>

          <PayoutSection
            eyebrow="Prize structure"
            title="Payout rules"
            supporting="Champion base and ring reserve are separate rule components."
            action={<Trophy className="h-5 w-5 text-[var(--lcc-semantic-achievement)]" aria-hidden="true" />}
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <RuleCard label="Weekly High" value={formatMoney(RULES.weeklyHighPayout)} helper={`${RULES.regularSeasonWeeks} regular-season weeks`} />
              <RuleCard label="Fourth Place" value={formatMoney(RULES.playoffPayouts.fourthPlace)} />
              <RuleCard label="Third Place" value={formatMoney(RULES.playoffPayouts.thirdPlace)} />
              <RuleCard label="Runner-Up" value={formatMoney(RULES.playoffPayouts.runnerUp)} />
              <RuleCard label="Champion Base" value={formatMoney(RULES.playoffPayouts.championBase)} />
              <RuleCard label="Ring Reserve" value={`Up to ${formatMoney(RULES.ringReserve)}`} />
            </div>
            <p className="lcc2-body mt-4">Unused ring reserve may return to the champion according to league rules. Actual ring cost is not assumed.</p>
          </PayoutSection>
        </div>

        <PayoutSection
          eyebrow="Current awards"
          title="2026 Weekly Awards"
          supporting="Verified public award records for the current season."
          action={<Award className="h-5 w-5 text-[var(--lcc-brand-secondary)]" aria-hidden="true" />}
          className="mt-6"
        >
          {operationalFinance?.publicAwards.awards.filter((award) => award.category === 'weekly-high').length ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {operationalFinance.publicAwards.awards.filter((award) => award.category === 'weekly-high').map((award) => <AwardRow key={`${award.season}-${award.week}-${award.ownerId ?? award.displayName}`} label={award.week ? `Week ${award.week}` : 'Weekly high'} value={`${award.displayName} · ${award.teamName} · ${formatMoney(award.amountCents / 100)} · ${award.status === 'paid' ? 'Paid' : 'Approved'}`} />)}
            </div>
          ) : (
            <EmptyState text="No 2026 weekly awards have been approved yet." />
          )}
          {operationalFinance ? <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3"><RuleCard label="Approved outstanding" value={formatMoney(operationalFinance.publicAwards.approvedOutstandingAmountCents / 100)} /><RuleCard label="Paid awards" value={formatMoney(operationalFinance.publicAwards.paidAwardAmountCents / 100)} /><RuleCard label="Confirmed awards" value={formatMoney(operationalFinance.publicAwards.confirmedAwardAmountCents / 100)} /></div> : null}
        </PayoutSection>

        <PayoutSection
          eyebrow="Historical aggregate"
          title="Overall accounting"
          supporting="Recorded historical values for completed financial seasons only."
          action={<History className="h-5 w-5 text-[var(--lcc-brand-secondary)]" aria-hidden="true" />}
          className="mt-6"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <PayoutMetric label="Recorded Winnings" value={formatMoney(overall.knownPayoutsReceived)} icon={<Trophy className="h-5 w-5" aria-hidden="true" />} />
            <PayoutMetric label="Recorded Net" value={formatSignedMoney(sumBalances(historicalFinance))} icon={<WalletCards className="h-5 w-5" aria-hidden="true" />} />
            <PayoutMetric label="Reconciled Seasons" value={`${reconciledSeasons}/${historicalFinance.length}`} helper="2014–2025 coverage" icon={<CheckCircle2 className="h-5 w-5" aria-hidden="true" />} />
            <PayoutMetric label="Documented Discrepancies" value={String(discrepancySeasons)} helper="Source records preserved" icon={<FileWarning className="h-5 w-5" aria-hidden="true" />} />
          </div>
          <div className="mt-4 rounded-xl border border-dashed border-[var(--lcc-color-border-strong)] bg-[var(--lcc-color-surface-muted)] p-4">
            <p className="lcc2-label">Known league expenses</p>
            <p className="lcc2-body mt-1">No verified structured league expenses are recorded. Ring reserve allocations are not treated as expenses.</p>
          </div>
        </PayoutSection>

        <PayoutSection
          eyebrow="Recorded financial history"
          title="Season summary"
          supporting="Select a completed season to review public-safe aggregate accounting."
          action={<CalendarDays className="h-5 w-5 text-[var(--lcc-brand-secondary)]" aria-hidden="true" />}
          className="mt-6"
        >
          <label className="block max-w-xs">
            <span className="lcc2-label">Historical season</span>
            <select value={selectedSeason} onChange={(event) => setSelectedSeason(Number(event.target.value))} className="mt-2 min-h-11 w-full rounded-lg border border-[var(--lcc-color-border-strong)] bg-[var(--lcc-color-surface-raised)] px-3 font-ui text-sm font-bold text-[var(--lcc-color-text)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--lcc-interactive-focus)]">
              {HISTORICAL_SEASONS.map((season) => <option key={season} value={season}>{season}</option>)}
            </select>
          </label>

          {selectedProjection && selectedFinance ? (
            <div className="mt-5">
              <div className="flex flex-col gap-3 border-b border-[var(--lcc-color-border)] pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="lcc2-label text-[var(--lcc-brand-secondary)]">Selected season</p><h3 className="mt-1 font-ui text-2xl font-black text-[var(--lcc-color-text)]">{selectedSeason} financial summary</h3></div>
                <StatusBadge status={selectedReconciliation.status} />
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <PayoutMetric label="Recorded Winnings" value={formatMoney(sumManagerPayouts(selectedFinance))} icon={<Trophy className="h-5 w-5" aria-hidden="true" />} />
                <PayoutMetric label="Recorded Net" value={formatSignedMoney(sumBalances([selectedFinance]))} icon={<WalletCards className="h-5 w-5" aria-hidden="true" />} />
                <PayoutMetric label="Known Awards" value={formatMoney(selectedProjection.aggregateAwards)} icon={<Award className="h-5 w-5" aria-hidden="true" />} />
                <PayoutMetric label="Known Expenses" value={selectedProjection.leagueExpenses ? formatMoney(selectedProjection.leagueExpenses) : 'Not recorded'} icon={<Receipt className="h-5 w-5" aria-hidden="true" />} />
              </div>
              {selectedReconciliation.status === 'documented-discrepancy' && <p className="lcc2-body mt-4 rounded-lg border border-[color-mix(in_srgb,var(--lcc-semantic-warning)_35%,transparent)] bg-[color-mix(in_srgb,var(--lcc-semantic-warning)_8%,var(--lcc-color-surface-raised))] p-3">This season contains a documented source discrepancy. Recorded values remain unchanged.</p>}
            </div>
          ) : <EmptyState text="Season finance is not available." />}
        </PayoutSection>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <PayoutSection eyebrow="Recorded awards" title={`${selectedSeason} award structure`} action={<Medal className="h-5 w-5 text-[var(--lcc-semantic-achievement)]" aria-hidden="true" />}>
            {selectedAwards.length ? <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{selectedAwards.map((award) => <AwardRow key={award.label} label={award.label} value={`${formatMoney(award.amount)} · ${award.recipients || award.count + ' recorded awards'}`} />)}</div> : <EmptyState text="No recorded awards for this season." />}
          </PayoutSection>
          <PayoutSection eyebrow="Verified expenses" title={`${selectedSeason} league expenses`} action={<Receipt className="h-5 w-5 text-[var(--lcc-color-text-muted)]" aria-hidden="true" />}>
            {selectedProjection?.leagueExpenses ? <AwardRow label="Recorded expenses" value={formatMoney(selectedProjection.leagueExpenses)} /> : <EmptyState text="No verified league expenses recorded." />}
          </PayoutSection>
        </div>

        <div className="mt-6 rounded-xl border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface-muted)] p-4 sm:p-5">
          <p className="lcc2-label text-[var(--lcc-brand-secondary)]">Coverage and reconciliation</p>
          <p className="lcc2-body mt-2">Recorded financial history covers 2014–2025. The 2026 current ledger is initialized and pending reconciliation. Historical source discrepancies are documented rather than silently corrected.</p>
          <Link href="/league-info/constitution#financial" className="mt-3 inline-flex items-center gap-2 font-ui text-sm font-black text-[var(--lcc-interactive)] underline underline-offset-4">View financial rules in the Constitution<ArrowLeft className="h-4 w-4 rotate-180" aria-hidden="true" /></Link>
        </div>
      </div>
      </main>
    </LeagueInfoShell>
  );
}

function PayoutSection({ eyebrow, title, supporting, action, className = '', children }: { eyebrow: string; title: string; supporting?: string; action?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <section className={`lcc2-card p-0 ${className}`}>
      <div className="flex flex-col gap-3 border-b border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface-muted)] px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
        <div><p className="lcc2-section-heading__eyebrow">{eyebrow}</p><h2 className="lcc2-section-heading__title">{title}</h2>{supporting && <p className="lcc2-section-heading__supporting">{supporting}</p>}</div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function PayoutMetric({ label, value, helper, icon }: { label: string; value: string; helper?: string; icon: ReactNode }) {
  return <article className="lcc2-metric-card"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--lcc-color-surface-muted)] text-[var(--lcc-brand-secondary)]">{icon}</div><p className="lcc2-metric-card__label mt-4">{label}</p><p className="lcc2-metric-card__value">{value}</p>{helper && <p className="lcc2-metric-card__helper mt-2">{helper}</p>}</article>;
}

function RuleCard({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return <div className="rounded-xl border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface-raised)] p-3"><p className="lcc2-label">{label}</p><p className="mt-2 font-ui text-xl font-black text-[var(--lcc-color-text)]">{value}</p>{helper && <p className="mt-1 font-ui text-xs font-semibold text-[var(--lcc-color-text-muted)]">{helper}</p>}</div>;
}

function AwardRow({ label, value }: { label: string; value: string }) {
  return <div className="flex flex-col items-start gap-1 rounded-lg border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface-raised)] px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3"><span className="font-ui text-sm font-bold text-[var(--lcc-color-text-muted)]">{label}</span><span className="break-words font-ui text-sm font-black text-[var(--lcc-color-text)] sm:text-right">{value}</span></div>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-[var(--lcc-color-border-strong)] bg-[var(--lcc-color-surface-muted)] px-4 py-4 font-ui text-sm font-bold text-[var(--lcc-color-text-muted)]">{text}</div>;
}

function DuesStatusList({ statuses }: { statuses: readonly { managerName: string; paymentStatus: 'unpaid' | 'partial' | 'paid' | 'waived' | null }[] }) {
  const paid = statuses.filter((owner) => owner.paymentStatus === 'paid');
  const partial = statuses.filter((owner) => owner.paymentStatus === 'partial');
  const unpaid = statuses.filter((owner) => owner.paymentStatus === 'unpaid');
  const unavailable = statuses.filter((owner) => owner.paymentStatus !== 'paid' && owner.paymentStatus !== 'partial' && owner.paymentStatus !== 'unpaid');

  return (
    <div className="mt-4 rounded-xl border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface-raised)] p-4 sm:p-5">
      <p className="lcc2-label text-[var(--lcc-brand-secondary)]">{LCC_CURRENT_SEASON} Dues Status</p>
      <p className="lcc2-body mt-1">Public status only; settlement details remain private.</p>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatusOwnerGroup label="Paid" owners={paid} />
        <StatusOwnerGroup label="Partial" owners={partial} />
        <StatusOwnerGroup label="Unpaid" owners={unpaid} />
        {unavailable.length ? <StatusOwnerGroup label="Status unavailable" owners={unavailable} /> : null}
      </div>
    </div>
  );
}

function StatusOwnerGroup({ label, owners }: { label: string; owners: readonly { managerName: string; paymentStatus: 'unpaid' | 'partial' | 'paid' | 'waived' | null }[] }) {
  return (
    <div>
      <p className="lcc2-label">{label}</p>
      {owners.length ? <div className="mt-2 flex flex-wrap gap-2">{owners.map((owner) => <span key={owner.managerName} className="rounded-full border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface-muted)] px-3 py-1.5 font-ui text-sm font-bold text-[var(--lcc-color-text)]">{owner.managerName}{owner.paymentStatus && owner.paymentStatus !== 'paid' ? ` · ${formatPaymentStatus(owner.paymentStatus)}` : ''}</span>)}</div> : <p className="lcc2-body mt-2">None recorded.</p>}
    </div>
  );
}

function formatPaymentStatus(status: 'unpaid' | 'partial' | 'waived') {
  return status === 'partial' ? 'Partially paid' : status === 'waived' ? 'Waived' : 'Unpaid';
}

function StatusBadge({ status }: { status: ReconciliationStatus }) {
  const label = status === 'documented-discrepancy' ? 'Documented Discrepancy' : status.replace('-', ' ');
  const tone = status === 'reconciled' ? 'lcc2-badge--info' : status === 'documented-discrepancy' ? 'lcc2-badge--warning' : 'lcc2-badge--neutral';
  return <span className={`lcc2-badge ${tone}`}>{label}</span>;
}

function getAwardCategories(finance: SeasonFinancialData) {
  const categories = [
    ['champion', 'Champion'],
    ['runnerUp', 'Runner-Up'],
    ['thirdPlace', 'Third Place'],
    ['fourthPlace', 'Fourth Place'],
    ['weeklyHigh', 'Weekly Awards'],
    ['ringReserve', 'Ring Reserve Allocation'],
    ['other', 'Other Recorded Awards'],
  ] as const;

  return categories.flatMap(([type, label]) => {
    const awards = finance.awards.filter((award) => award.type === type);
    if (!awards.length) return [];
    return [{ label, amount: awards.reduce((total, award) => total + (award.amount ?? 0), 0), count: awards.length, recipients: awards.map((award) => award.managerName).filter(Boolean).join(', ') }];
  });
}

function sumManagerPayouts(finance: SeasonFinancialData) {
  return finance.managers.reduce((total, manager) => total + (manager.payoutsReceived ?? 0), 0);
}

function sumBalances(seasons: readonly SeasonFinancialData[]) {
  return seasons.reduce((total, season) => total + season.managers.reduce((seasonTotal, manager) => seasonTotal + (manager.balance ?? 0), 0), 0);
}

function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined) return 'Not yet recorded';
  return `$${value.toLocaleString()}`;
}

function formatSignedMoney(value: number | null | undefined) {
  if (value === null || value === undefined) return 'Not yet recorded';
  return value < 0 ? `-$${Math.abs(value).toLocaleString()}` : `$${value.toLocaleString()}`;
}

function formatAmount(value: number | null | undefined) {
  return value === null || value === undefined ? 'Not yet recorded' : formatMoney(value);
}
