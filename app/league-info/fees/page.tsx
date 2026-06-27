'use client';

import { useState } from 'react';
import {
  Crown,
  DollarSign,
  Landmark,
  Medal,
  Receipt,
  ShieldCheck,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import { LeagueHero } from '@/components/league/LeagueHero';
import { LeagueMetricCard } from '@/components/league/LeagueMetricCard';
import { LeaguePageShell } from '@/components/league/LeaguePageShell';
import { LeagueSection } from '@/components/league/LeagueSection';
import { LeagueTabBar } from '@/components/league/LeagueTabBar';
import { getOwnerImagePath } from '@/lib/ownerImages';

type LedgerTab = 'current' | 'history';

type OwnerBase = {
  name: string;
  img: string;
};

type CurrentLedgerRow = OwnerBase & {
  paidTowardDues: number;
  weeklyHighs: number;
  winnings: number;
  finish: string;
  totalWon: number;
};

type HistoricalEarningsRow = OwnerBase & {
  weeklyHighs: number;
  finish: string;
  totalWon: number;
};

type WeeklyPayout = {
  wk: number;
  name: string;
  amount: number;
  note?: string;
};

const CURRENT_SEASON = 2026;
const DUES_GOAL = 600;
const DYNASTY_DEPOSIT = 300;
const PAID_2026_MANAGERS = new Set(['Ray', 'Mike Estes', 'Tyrone']);

const ACTIVE_OWNERS: readonly OwnerBase[] = [
  { name: 'Ray', img: getOwnerImagePath('ray-long') },
  { name: 'Mike Estes', img: getOwnerImagePath('mike-estes') },
  { name: 'Tyrone', img: getOwnerImagePath('tyrone-poist') },
  { name: 'Amart', img: getOwnerImagePath('anthony-martinez') },
  { name: 'Ben', img: getOwnerImagePath('ben-isbell') },
  { name: 'Bill', img: getOwnerImagePath('bill-gross') },
  { name: 'Earl', img: getOwnerImagePath('earl-perkins') },
  { name: 'Jeffrey', img: getOwnerImagePath('jeffrey-hudgins') },
  { name: 'Keith', img: getOwnerImagePath('keith-winder') },
  { name: 'Loren', img: getOwnerImagePath('loren-michaels') },
  { name: 'Mike M', img: getOwnerImagePath('mike-mcburnie') },
  { name: 'Rob', img: getOwnerImagePath('rob-jenkins') },
];

const CURRENT_LEDGER: readonly CurrentLedgerRow[] = ACTIVE_OWNERS.map((owner) => ({
  ...owner,
  paidTowardDues: PAID_2026_MANAGERS.has(owner.name) ? 50 : 0,
  weeklyHighs: 0,
  winnings: 0,
  finish: '',
  totalWon: 0,
}));

const WEEKLY_PAYOUT_HISTORY_2025: readonly WeeklyPayout[] = [
  { wk: 1, name: 'Amart', amount: 10 },
  { wk: 2, name: 'Tyrone', amount: 10 },
  { wk: 3, name: 'Ben', amount: 10 },
  { wk: 4, name: 'Ray', amount: 10 },
  { wk: 5, name: 'Tyrone', amount: 10 },
  { wk: 6, name: 'Ray', amount: 10 },
  { wk: 7, name: 'Earl', amount: 10, note: 'Credit applied' },
  { wk: 8, name: 'Tyrone', amount: 10 },
  { wk: 9, name: 'Jeffrey', amount: 10 },
  { wk: 10, name: 'Ray', amount: 10 },
  { wk: 11, name: 'Amart', amount: 10 },
  { wk: 12, name: 'Rob', amount: 10 },
  { wk: 13, name: 'Jeffrey', amount: 10 },
  { wk: 14, name: 'Ben', amount: 10 },
];

const EARNINGS_HISTORY_2025: readonly HistoricalEarningsRow[] = [
  { name: 'Tyrone', weeklyHighs: 3, finish: '1st', totalWon: 299, img: getOwnerImagePath('tyrone-poist') },
  { name: 'Mike M', weeklyHighs: 0, finish: '2nd', totalWon: 100, img: getOwnerImagePath('mike-mcburnie') },
  { name: 'Ben', weeklyHighs: 2, finish: '3rd', totalWon: 70, img: getOwnerImagePath('ben-isbell') },
  { name: 'Ray', weeklyHighs: 3, finish: '4th', totalWon: 55, img: getOwnerImagePath('ray-long') },
  { name: 'Jeffrey', weeklyHighs: 2, finish: '6th', totalWon: 20, img: getOwnerImagePath('jeffrey-hudgins') },
  { name: 'Amart', weeklyHighs: 2, finish: '9th', totalWon: 20, img: getOwnerImagePath('anthony-martinez') },
  { name: 'Earl', weeklyHighs: 1, finish: '5th', totalWon: 10, img: getOwnerImagePath('earl-perkins') },
  { name: 'Rob', weeklyHighs: 1, finish: '7th', totalWon: 10, img: getOwnerImagePath('rob-jenkins') },
  { name: 'Bill', weeklyHighs: 0, finish: '8th', totalWon: 0, img: getOwnerImagePath('bill-gross') },
  { name: 'Keith', weeklyHighs: 0, finish: '10th', totalWon: 0, img: getOwnerImagePath('keith-winder') },
  { name: 'Loren', weeklyHighs: 0, finish: '11th', totalWon: 0, img: getOwnerImagePath('loren-michaels') },
  { name: 'Mike Estes', weeklyHighs: 0, finish: '12th', totalWon: 0, img: getOwnerImagePath('mike-estes') },
];

export default function CaddyFees() {
  const [activeTab, setActiveTab] = useState<LedgerTab>('current');
  const duesCollected = CURRENT_LEDGER.reduce((acc, curr) => acc + curr.paidTowardDues, 0);
  const remainingDue = DUES_GOAL - duesCollected;

  return (
    <LeaguePageShell
      topLabel="Payouts"
      topIcon={<DollarSign className="h-3.5 w-3.5" aria-hidden="true" />}
    >
      <LeagueHero
        icon={<DollarSign className="h-8 w-8" aria-hidden="true" />}
        label="Official LCC Ledger"
        title="Caddy Fees"
        subtitle={`League fee rules, prize money policy, and the active ${CURRENT_SEASON} season ledger.`}
      />

      <div className="mx-auto mt-12 max-w-[1100px]">
        <LeagueSection
          eyebrow="Ownership Expectations"
          title="Entry Fees & Future-Season Deposit"
          action={<Receipt className="h-5 w-5 text-[var(--lcc-gold)]" aria-hidden="true" />}
          className="mb-10"
        >
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <LeagueMetricCard
              icon={<DollarSign className="h-5 w-5" aria-hidden="true" />}
              label="League Fee"
              value="$50"
              helperText="Annual fee per owner"
              tone="neutral"
            />
            <LeagueMetricCard
              icon={<ShieldCheck className="h-5 w-5" aria-hidden="true" />}
              label="New Owner Year 1"
              value="$75"
              helperText="$50 current year + $25 future-season deposit"
              tone="warning"
            />
          </div>

          <div style={policyCopyStyle}>
            <p>
              The annual league fee is <strong>$50 per owner</strong> and must be paid through Venmo before the start
              of each season. Year 2 and future-season league fees remain <strong>$50</strong>.
            </p>
            <p>
              New owners pay <strong>$75</strong> in Year 1: $50 for the current season plus a $25 future-season
              deposit. If an owner leaves, they do not recoup that future-season fee. The forfeited future fee is
              awarded to the Champion of the upcoming season.
            </p>
          </div>
        </LeagueSection>

        <LeagueSection
          eyebrow="Prize Money"
          title="Season Payout Rules"
          action={<Trophy className="h-5 w-5 text-[var(--lcc-gold)]" aria-hidden="true" />}
          className="mb-10"
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <LeagueMetricCard
              icon={<TrendingUp className="h-5 w-5" aria-hidden="true" />}
              label="Weekly High"
              value="$10"
              helperText="14 regular-season weeks, $140 total"
              tone="neutral"
            />
            <LeagueMetricCard
              icon={<Medal className="h-5 w-5" aria-hidden="true" />}
              label="4th Place"
              value="$25"
              helperText="Fixed season payout"
              tone="neutral"
            />
            <LeagueMetricCard
              icon={<Medal className="h-5 w-5" aria-hidden="true" />}
              label="3rd Place"
              value="$50"
              helperText="Fixed season payout"
              tone="neutral"
            />
            <LeagueMetricCard
              icon={<Medal className="h-5 w-5" aria-hidden="true" />}
              label="Runner-Up"
              value="$100"
              helperText="Fixed season payout"
              tone="neutral"
            />
            <LeagueMetricCard
              icon={<Crown className="h-5 w-5" aria-hidden="true" />}
              label="Champion Base"
              value="$205"
              helperText="Plus leftover ring reserve"
              tone="positive"
            />
            <LeagueMetricCard
              icon={<ShieldCheck className="h-5 w-5" aria-hidden="true" />}
              label="Ring Reserve"
              value="Up to $80"
              helperText="Unused reserve returns to Champion"
              tone="warning"
            />
          </div>

          <div style={policyCopyStyle}>
            <p>
              Prize money pays <strong>$10</strong> to the weekly high scorer during the 14-week regular season,{' '}
              <strong>$25</strong> to 4th place, <strong>$50</strong> to 3rd place, <strong>$100</strong> to 2nd place,
              and a <strong>$205</strong> Champion base payout.
            </p>
            <p>
              The Champion receives <strong>$205 plus the leftover ring reserve after actual ring cost</strong>. Up to
              $80 is allocated to the ring; if the ring costs less, the remaining money goes to the Champion.
            </p>
            <p>
              Example: if the ring costs about <strong>$16</strong>, the Champion receives{' '}
              <strong>$205 + $64 leftover = about $269</strong>, before any weekly high payouts or forfeited future
              fees are added.
            </p>
          </div>
        </LeagueSection>

        <LeagueTabBar
          items={[
            {
              label: 'Current Ledger',
              value: 'current',
              icon: <Landmark className="h-4 w-4" aria-hidden="true" />,
            },
            {
              label: 'Earnings History',
              value: 'history',
              icon: <Receipt className="h-4 w-4" aria-hidden="true" />,
            },
          ]}
          value={activeTab}
          onChange={(value) => setActiveTab(value as LedgerTab)}
          ariaLabel="Caddy Fees views"
          className="mb-8"
        />

        {activeTab === 'current' ? (
          <>
            <div className="mb-5">
              <p className="font-ui text-xs font-black uppercase text-[var(--lcc-gold)]">
                {CURRENT_SEASON} Current Ledger
              </p>
              <p className="mt-2 font-ui text-sm font-medium leading-6 text-[var(--lcc-text-muted)]">
                The current ledger represents the active league season. Prior weekly payout history lives under
                Earnings History.
              </p>
            </div>

            <div className="mb-10 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
              <LeagueMetricCard
                icon={<DollarSign className="h-5 w-5 text-[var(--lcc-gold)]" aria-hidden="true" />}
                label="Dues Collected"
                value={formatCurrency(duesCollected)}
                helperText="Paid: Ray, Mike Estes, Tyrone"
                tone="positive"
              />
              <LeagueMetricCard
                icon={<Receipt className="h-5 w-5" aria-hidden="true" />}
                label="Goal"
                value={formatCurrency(DUES_GOAL)}
                helperText="12 owners x $50"
                tone="neutral"
              />
              <LeagueMetricCard
                icon={<TrendingUp className="h-5 w-5" aria-hidden="true" />}
                label="Remaining Due"
                value={formatCurrency(remainingDue)}
                helperText="9 owners outstanding"
                tone="warning"
              />
              <LeagueMetricCard
                icon={<ShieldCheck className="h-5 w-5" aria-hidden="true" />}
                label="Dynasty Deposit"
                value={`${formatCurrency(DYNASTY_DEPOSIT)}.00`}
                helperText="Escrow Protection Fund"
                tone="warning"
              />
            </div>

            <LeagueSection
              eyebrow="Ledger"
              title="The Manager Vault"
              action={<Landmark className="h-5 w-5 text-[var(--lcc-gold)]" aria-hidden="true" />}
              contentClassName="overflow-x-auto p-0"
            >
              <table style={{ width: '100%', minWidth: '900px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--lcc-surface-muted)', textAlign: 'left', fontSize: '0.75rem' }}>
                    <th style={tablePadding}>Manager</th>
                    <th style={tablePadding}>Paid Toward Dues</th>
                    <th style={tablePadding}>Weekly Highs</th>
                    <th style={tablePadding}>Winnings</th>
                    <th style={tablePadding}>Finish</th>
                    <th style={{ ...tablePadding, color: '#1A472A' }}>Total Won</th>
                    <th style={tablePadding}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {CURRENT_LEDGER.map((owner) => {
                    const isPaid = owner.paidTowardDues >= 50;

                    return (
                      <tr key={owner.name} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={tablePadding}>
                          <ManagerCell name={owner.name} img={owner.img} />
                        </td>
                        <td style={tablePadding}>{formatCurrency(owner.paidTowardDues)}</td>
                        <td style={tablePadding}>{owner.weeklyHighs}</td>
                        <td style={tablePadding}>{formatCurrency(owner.winnings)}</td>
                        <td style={tablePadding}>{owner.finish}</td>
                        <td style={{ ...tablePadding, color: '#1A472A', fontWeight: 'bold' }}>
                          {formatCurrency(owner.totalWon)}
                        </td>
                        <td style={tablePadding}>
                          <span style={statusBadgeStyle(isPaid)}>{isPaid ? 'Paid' : 'Unpaid'}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </LeagueSection>

            <LeagueSection
              eyebrow="Payouts"
              title={`${CURRENT_SEASON} Weekly High Scorers ($10/wk)`}
              action={<TrendingUp className="h-5 w-5 text-[var(--lcc-gold)]" aria-hidden="true" />}
              className="mt-10"
            >
              <p className="font-ui text-sm font-medium leading-6 text-[var(--lcc-text-muted)]">
                No weekly high payouts have been recorded for {CURRENT_SEASON} yet.
              </p>
            </LeagueSection>
          </>
        ) : (
          <>
            <LeagueSection
              eyebrow="Earnings History"
              title="2025 Season Earnings Summary"
              action={<Receipt className="h-5 w-5 text-[var(--lcc-gold)]" aria-hidden="true" />}
              contentClassName="overflow-x-auto p-0"
            >
              <table style={{ width: '100%', minWidth: '760px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--lcc-surface-muted)', textAlign: 'left', fontSize: '0.75rem' }}>
                    <th style={tablePadding}>Manager</th>
                    <th style={tablePadding}>Weekly Highs</th>
                    <th style={tablePadding}>Finish</th>
                    <th style={{ ...tablePadding, color: '#1A472A' }}>Total Won</th>
                  </tr>
                </thead>
                <tbody>
                  {EARNINGS_HISTORY_2025.map((owner) => (
                    <tr key={owner.name} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={tablePadding}>
                        <ManagerCell name={owner.name} img={owner.img} />
                      </td>
                      <td style={tablePadding}>{owner.weeklyHighs}</td>
                      <td style={tablePadding}>{owner.finish}</td>
                      <td style={{ ...tablePadding, color: '#1A472A', fontWeight: 'bold' }}>
                        {formatCurrency(owner.totalWon)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </LeagueSection>

            <LeagueSection
              eyebrow="Weekly Payouts"
              title="2025 Weekly High Payout History ($10/wk)"
              action={<TrendingUp className="h-5 w-5 text-[var(--lcc-gold)]" aria-hidden="true" />}
              className="mt-10"
              contentClassName="overflow-x-auto p-0"
            >
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr
                    style={{
                      borderBottom: '2px solid var(--lcc-surface-muted)',
                      textAlign: 'left',
                      fontSize: '0.8rem',
                      color: '#999',
                    }}
                  >
                    <th style={{ padding: '10px' }}>Week</th>
                    <th style={{ padding: '10px' }}>Owner</th>
                    <th style={{ padding: '10px' }}>Payout</th>
                  </tr>
                </thead>
                <tbody>
                  {WEEKLY_PAYOUT_HISTORY_2025.map((week) => (
                    <tr key={week.wk} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px', fontSize: '0.9rem' }}>Week {week.wk}</td>
                      <td style={{ padding: '10px', fontWeight: 'bold' }}>{week.name}</td>
                      <td style={{ padding: '10px', color: '#1A472A', fontWeight: 'bold' }}>
                        {week.note ? `${formatCurrency(0)} (${week.note})` : formatCurrency(week.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </LeagueSection>
          </>
        )}
      </div>
    </LeaguePageShell>
  );
}

function ManagerCell({ name, img }: OwnerBase) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <img
        src={img}
        alt=""
        style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }}
        onError={(event) => {
          event.currentTarget.src = '/logo.png';
        }}
      />
      <strong>{name}</strong>
    </div>
  );
}

function formatCurrency(amount: number) {
  return `$${amount}`;
}

const policyCopyStyle = {
  color: 'var(--lcc-text-muted)',
  fontSize: '0.98rem',
  lineHeight: 1.7,
  marginTop: '20px',
};

const tablePadding = { padding: '15px' };

const statusBadgeStyle = (paid: boolean) => ({
  fontSize: '0.6rem',
  fontWeight: 'bold',
  padding: '4px 10px',
  borderRadius: '10px',
  backgroundColor: paid ? '#E6F4EA' : '#FCE8E6',
  color: paid ? '#1A472A' : '#d32f2f',
  border: `1px solid ${paid ? '#1A472A' : '#d32f2f'}`,
});
