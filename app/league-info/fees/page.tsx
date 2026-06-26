'use client';

import { 
  Crown, DollarSign, Landmark, Medal, Receipt, ShieldCheck, TrendingUp, Trophy
} from 'lucide-react';
import { LeagueHero } from '@/components/league/LeagueHero';
import { LeagueMetricCard } from '@/components/league/LeagueMetricCard';
import { LeaguePageShell } from '@/components/league/LeaguePageShell';
import { LeagueSection } from '@/components/league/LeagueSection';

// DATA SOURCE: Manual Tracker
const WEEKLY_DATA = [
  { wk: 1, name: "Amart", amount: 10 }, { wk: 2, name: "Tyrone", amount: 10 },
  { wk: 3, name: "Ben", amount: 10 }, { wk: 4, name: "Ray", amount: 10 },
  { wk: 5, name: "Tyrone", amount: 10 }, { wk: 6, name: "Ray", amount: 10 },
  { wk: 7, name: "Earl", amount: 10 }, { wk: 8, name: "Tyrone", amount: 10 },
  { wk: 9, name: "Jeffrey", amount: 10 }, { wk: 10, name: "Ray", amount: 10 },
  { wk: 11, name: "Amart", amount: 10 }, { wk: 12, name: "Rob", amount: 10 },
  { wk: 13, name: "Jeffrey", amount: 10 }, { wk: 14, name: "Ben", amount: 10 }
];

// DATA SOURCE: Manual Tracker Payouts
const OWNER_SUMMARY = [
  { name: "Tyrone", highs: 3, place: "1st", won: 299, paid: 50, img: "/managers/Tyrone.png" },
  { name: "Mike M", highs: 0, place: "2nd", won: 100, paid: 50, img: "/managers/Mike M.png" },
  { name: "Ben", highs: 2, place: "3rd", won: 70, paid: 50, img: "/managers/Ben.png" },
  { name: "Ray", highs: 3, place: "4th", won: 55, paid: 50, img: "/managers/Ray.png" },
  { name: "Jeffrey", highs: 2, place: "6th", won: 20, paid: 50, img: "/managers/Jeffrey.png" },
  { name: "Amart", highs: 2, place: "9th", won: 20, paid: 50, img: "/managers/Amart.png" },
  { name: "Earl", highs: 1, place: "5th", won: 10, paid: 10, img: "/managers/EP.png" }, // Partial Credit
  { name: "Rob", highs: 1, place: "7th", won: 10, paid: 50, img: "/managers/Rob.png" },
  { name: "Bill", highs: 0, place: "8th", won: 0, paid: 50, img: "/managers/Bill.png" },
  { name: "Keith", highs: 0, place: "10th", won: 0, paid: 50, img: "/managers/KW.png" },
  { name: "Loren", highs: 0, place: "11th", won: 0, paid: 50, img: "/managers/Loren.png" },
  { name: "Mike E", highs: 0, place: "12th", won: 0, paid: 50, img: "/managers/Mike E.png" },
];

export default function CaddyFees() {
  const duesGoal = 600; 
  const duesCollected = OWNER_SUMMARY.reduce((acc, curr) => acc + curr.paid, 0); // $560

  return (
    <LeaguePageShell
      topLabel="Payouts"
      topIcon={<DollarSign className="h-3.5 w-3.5" aria-hidden="true" />}
    >
      <LeagueHero
        icon={<DollarSign className="h-8 w-8" aria-hidden="true" />}
        label="Official LCC Ledger"
        title="Caddy Fees"
        subtitle="League fee rules, prize money policy, and the currently shown 2025 ledger snapshot."
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
              deposit. If an owner leaves, they do not recoup that future-season fee. The forfeited future fee is awarded
              to the Champion of the upcoming season.
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
              <strong>$205 + $64 leftover = about $269</strong>, before any weekly high payouts or forfeited future fees
              are added.
            </p>
          </div>
        </LeagueSection>

        {/* VAULT SECTION */}
        <div className="mb-5">
          <p className="font-ui text-xs font-black uppercase text-[var(--lcc-gold)]">
            2025 Ledger Snapshot
          </p>
          <p className="mt-2 font-ui text-sm font-medium leading-6 text-[var(--lcc-text-muted)]">
            The ledger below is the currently shown 2025 tracker data. It is preserved as a historical/current ledger
            view and should not be confused with 2026 season setup.
          </p>
        </div>

        <div className="mb-10 grid grid-cols-1 gap-5 md:grid-cols-2">
          <LeagueMetricCard
            icon={<DollarSign className="h-5 w-5 text-[var(--lcc-gold)]" aria-hidden="true" />}
            label="2025 Dues Collected"
            value={`$${duesCollected}.00`}
            helperText={`Goal: $${duesGoal}.00 (Earl: $40 Balance)`}
            tone="positive"
          />
          <LeagueMetricCard
            icon={<ShieldCheck className="h-5 w-5" aria-hidden="true" />}
            label="Dynasty Deposit"
            value="$300.00"
            helperText="Escrow Protection Fund"
            tone="warning"
          />
        </div>

        {/* MANAGER VAULT LEDGER */}
        <LeagueSection
          eyebrow="Ledger"
          title="The Manager Vault"
          action={<Landmark className="h-5 w-5 text-[var(--lcc-gold)]" aria-hidden="true" />}
          contentClassName="overflow-x-auto p-0"
        >
            <table style={{ width: '100%', minWidth: '760px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--lcc-surface-muted)', textAlign: 'left', fontSize: '0.75rem' }}>
                  <th style={tablePadding}>Manager</th>
                  <th style={tablePadding}>Paid Toward Dues</th>
                  <th style={tablePadding}>Highs</th>
                  <th style={tablePadding}>Finish</th>
                  <th style={{...tablePadding, color: '#1A472A'}}>Total Won</th>
                  <th style={tablePadding}>Status</th>
                </tr>
              </thead>
              <tbody>
                {OWNER_SUMMARY.sort((a,b) => b.won - a.won).map(o => (
                  <tr key={o.name} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={tablePadding}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src={o.img} style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }} onError={(e:any)=>e.target.src='/logo.png'} />
                        <strong>{o.name}</strong>
                      </div>
                    </td>
                    <td style={tablePadding}>${o.paid}.00</td>
                    <td style={tablePadding}>{o.highs}</td>
                    <td style={tablePadding}>{o.place}</td>
                    <td style={{...tablePadding, color: '#1A472A', fontWeight: 'bold'}}>${o.won}.00</td>
                    <td style={tablePadding}>
                      <span style={statusBadgeStyle(o.paid === 50, o.name === 'Earl')}>
                        {o.paid === 50 ? 'PAID' : o.name === 'Earl' ? 'PARTIAL' : 'UNPAID'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </LeagueSection>

        {/* WEEKLY WINNERS LEDGER */}
        <LeagueSection
          eyebrow="Payouts"
          title="Weekly High Scorers ($10/wk)"
          action={<TrendingUp className="h-5 w-5 text-[var(--lcc-gold)]" aria-hidden="true" />}
          className="mt-10"
          contentClassName="overflow-x-auto p-0"
        >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--lcc-surface-muted)', textAlign: 'left', fontSize: '0.8rem', color: '#999' }}>
                  <th style={{ padding: '10px' }}>WEEK</th>
                  <th style={{ padding: '10px' }}>OWNER</th>
                  <th style={{ padding: '10px' }}>PAYOUT</th>
                </tr>
              </thead>
              <tbody>
                {WEEKLY_DATA.map(w => (
                  <tr key={w.wk} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px', fontSize: '0.9rem' }}>Week {w.wk}</td>
                    <td style={{ padding: '10px', fontWeight: 'bold' }}>{w.name}</td>
                    <td style={{ padding: '10px', color: '#1A472A', fontWeight: 'bold' }}>
                        {w.name === 'Earl' ? '$0.00 (Credit Applied)' : '$10.00'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </LeagueSection>
      </div>
    </LeaguePageShell>
  );
}

// STYLES
const policyCopyStyle = {
  color: 'var(--lcc-text-muted)',
  fontSize: '0.98rem',
  lineHeight: 1.7,
  marginTop: '20px',
};
const tablePadding = { padding: '15px' };
const statusBadgeStyle = (paid: boolean, partial: boolean) => ({
  fontSize: '0.6rem', fontWeight: 'bold', padding: '4px 10px', borderRadius: '10px',
  backgroundColor: paid ? '#E6F4EA' : partial ? '#FFF4E5' : '#FCE8E6', 
  color: paid ? '#1A472A' : partial ? '#C05621' : '#d32f2f',
  border: `1px solid ${paid ? '#1A472A' : partial ? '#C05621' : '#d32f2f'}`
});
