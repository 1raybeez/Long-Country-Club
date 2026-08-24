'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Trophy, Loader2, Crown, TrendingUp, Zap, ChevronDown, ChevronUp,
  ArrowDown, History
} from 'lucide-react';
import { LCC_CURRENT_SEASON, LCC_LEAGUE_HISTORY } from '@/lib/leagueConstants';
import { getLccOwnerBySleeperUserId } from '@/lib/lccOwners';
import { getOwnerImagePath } from '@/lib/ownerImages';
import { LeagueInfoShell } from '@/components/league/LeagueInfoShell';

const SLEEPER_ARCHIVE_SEASONS = LCC_LEAGUE_HISTORY.filter(
  ({ year }) => year >= 2019 && year < LCC_CURRENT_SEASON
);
const ARCHIVE_START_YEAR = Math.min(
  ...SLEEPER_ARCHIVE_SEASONS.map(({ year }) => year)
);
const ARCHIVE_END_YEAR = Math.max(
  ...SLEEPER_ARCHIVE_SEASONS.map(({ year }) => year)
);

export default function ArchivesPage() {
  const [stats, setStats] = useState<any[]>([]);
  const [seasonRecords, setSeasonRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState("");
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    };

    scrollToTop();
    const frameId = window.requestAnimationFrame(scrollToTop);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  useEffect(() => {
    if (!loading) {
      const frameId = window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      });

      return () => window.cancelAnimationFrame(frameId);
    }
  }, [loading]);

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      const aggregated: Record<string, any> = {};
      const allSeasonsList: any[] = [];
      
      try {
        for (const { year, id: leagueId } of SLEEPER_ARCHIVE_SEASONS) {
          setProgress(`Analyzing ${year} Season...`);

          const [rostersRes, usersRes] = await Promise.all([
            fetch(`https://api.sleeper.app/v1/league/${leagueId}/rosters`),
            fetch(`https://api.sleeper.app/v1/league/${leagueId}/users`)
          ]);

          if (!rostersRes.ok || !usersRes.ok) continue;

          const rosters = await rostersRes.json();
          const users = await usersRes.json();
          const userMap = users.reduce((map: Record<string, any>, user: any) => {
            map[user.user_id] = user;
            return map;
          }, {});

          rosters.forEach((r: any) => {
            const uid = r.owner_id;
            if (!uid) return;
            const sleeperUser = userMap[uid];
            const canonicalOwner = getLccOwnerBySleeperUserId(uid);
            const sleeperTeamName = sleeperUser?.metadata?.team_name || sleeperUser?.display_name || "Unknown";
            const realName = canonicalOwner?.displayName || sleeperTeamName;
            const teamName = canonicalOwner?.managerPage.sleeperName || sleeperTeamName;
            const avatar = sleeperUser?.avatar || null;

            if (!aggregated[uid]) {
              aggregated[uid] = { id: uid, realName, teamName, avatar, wins: 0, losses: 0, ties: 0, fpts: 0, ppts: 0, seasons: 0 };
            }
            
            aggregated[uid].wins += r.settings.wins || 0;
            aggregated[uid].losses += r.settings.losses || 0;
            aggregated[uid].ties += r.settings.ties || 0;
            aggregated[uid].fpts += (r.settings.fpts || 0) + (r.settings.fpts_decimal || 0) / 100;
            aggregated[uid].ppts += (r.settings.ppts || 0) + (r.settings.ppts_decimal || 0) / 100;
            aggregated[uid].seasons += 1;
            
            if (r.settings.fpts > 0) {
              allSeasonsList.push({ id: uid, realName, teamName, avatar, year, fpts: (r.settings.fpts || 0) + (r.settings.fpts_decimal || 0) / 100 });
            }
          });
        }
        setStats(Object.values(aggregated));
        setSeasonRecords(allSeasonsList);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    }
    fetchHistory();
  }, []);

  return (
    <LeagueInfoShell>
      <main className="lcc2-page-shell">
      <div className="lcc2-page-container">
        <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link href="/league-info" className="lcc2-button lcc2-button--secondary">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to League Info
            </Link>
            <p className="lcc2-label mt-7 text-[var(--lcc-brand-primary)]">League Info</p>
            <h1 className="lcc2-home-identity__title mt-2">League Archives</h1>
            <p className="lcc2-home-identity__supporting max-w-3xl">
              Detailed statistical leaderboards from LCC&apos;s Sleeper-era archive.
            </p>
          </div>
          <div className="lcc2-badge lcc2-badge--info self-start lg:self-end">
            Sleeper Era · {ARCHIVE_START_YEAR}–{ARCHIVE_END_YEAR}
          </div>
        </div>

        <section className="mb-6 grid gap-3 md:grid-cols-2" aria-label="Archive coverage">
          <div className="lcc2-card">
            <p className="lcc2-label text-[var(--lcc-brand-primary)]">Detailed statistical coverage</p>
            <p className="lcc2-body mt-2">
              Roster, scoring, win percentage, and lineup-efficiency records cover completed Sleeper seasons from {ARCHIVE_START_YEAR}–{ARCHIVE_END_YEAR}.
            </p>
          </div>
          <div className="lcc2-card">
            <p className="lcc2-label text-[var(--lcc-brand-primary)]">Historical placements</p>
            <p className="lcc2-body mt-2">
              Champions, podiums, and last-place history from 2003–2025 are preserved in the{' '}
              <Link href="/league-info/trophy-room" className="font-bold text-[var(--lcc-brand-primary)] underline decoration-[var(--lcc-color-accent)] underline-offset-4">
                Trophy Room
              </Link>.
            </p>
          </div>
        </section>

        {loading ? (
          <div className="lcc2-card flex min-h-56 flex-col items-center justify-center gap-4 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-[var(--lcc-brand-primary)]" aria-hidden="true" />
            <div>
              <p className="lcc2-label text-[var(--lcc-brand-primary)]">Loading Sleeper-era archive</p>
              <p className="lcc2-body mt-2">{progress || `Loading ${ARCHIVE_START_YEAR}–${ARCHIVE_END_YEAR} statistics…`}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <LeaderCard id="wins" title="All-Time Wins" icon={Trophy} color="" data={[...stats].sort((a,b) => b.wins - a.wins)} val={(m: any) => m.wins} label="Wins" exp={expandedCard} setExp={setExpandedCard} />
            <LeaderCard id="points" title="All-Time Points" icon={TrendingUp} color="" data={[...stats].sort((a,b) => b.fpts - a.fpts)} val={(m: any) => m.fpts.toLocaleString(undefined, { maximumFractionDigits: 0 })} label="Points" exp={expandedCard} setExp={setExpandedCard} />
            <LeaderCard id="best_season" title="Best Season" icon={History} color="" data={[...seasonRecords].sort((a,b) => b.fpts - a.fpts)} val={(m: any) => m.fpts.toLocaleString(undefined, { maximumFractionDigits: 0 })} label="Points" exp={expandedCard} setExp={setExpandedCard} />
            <LeaderCard id="worst_season" title="Lowest Season" icon={ArrowDown} color="" data={[...seasonRecords].filter(m => m.fpts > 500).sort((a,b) => a.fpts - b.fpts)} val={(m: any) => m.fpts.toLocaleString(undefined, { maximumFractionDigits: 0 })} label="Points" exp={expandedCard} setExp={setExpandedCard} />
            <LeaderCard id="winpct" title="Best Win %" icon={Crown} color="" data={[...stats].filter(s => s.seasons >= 2).sort((a,b) => (b.wins/(b.wins+b.losses)) - (a.wins/(a.wins+a.losses)))} val={(m: any) => ((m.wins / (m.wins + m.losses)) * 100).toFixed(1) + "%"} label="Win Pct" exp={expandedCard} setExp={setExpandedCard} />
            <LeaderCard id="efficiency" title="Lineup Efficiency" icon={Zap} color="" data={[...stats].filter(s => s.ppts > 0).sort((a,b) => (b.fpts/b.ppts) - (a.fpts/a.ppts))} val={(m: any) => ((m.fpts / m.ppts) * 100).toFixed(1) + "%"} label="Start %" exp={expandedCard} setExp={setExpandedCard} />
          </div>
        )}
      </div>
      </main>
    </LeagueInfoShell>
  );
}

function LeaderCard({ id, title, icon: Icon, color, data, val, label, exp, setExp }: any) {
  const isExp = exp === id;
  const list = isExp ? data : data.slice(0, 5);
  return (
    <section className="lcc2-card flex h-full flex-col overflow-hidden p-0" aria-labelledby={`${id}-heading`}>
      <div className="border-b border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface-muted)] px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--lcc-color-surface-raised)] text-[var(--lcc-brand-primary)]">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
          <h2 id={`${id}-heading`} className="font-ui text-sm font-black uppercase tracking-[0.06em] text-[var(--lcc-color-text)]">{title}</h2>
        </div>
        <p className="lcc2-label mt-3">Sleeper Era · {ARCHIVE_START_YEAR}–{ARCHIVE_END_YEAR}</p>
      </div>
      <div className="flex-grow divide-y divide-[var(--lcc-color-border)]">
        {list.map((m: any, i: number) => (
          <div key={`${m.id}-${m.year || 'all'}`} className="flex items-center justify-between gap-3 p-3 transition-colors hover:bg-[var(--lcc-color-surface-muted)]">
            <div className="flex min-w-0 items-center gap-3">
               <span className={`w-4 shrink-0 text-center font-ui text-sm font-black ${i === 0 ? 'text-[var(--lcc-color-accent)]' : 'text-[var(--lcc-color-text-subtle)]'}`}>{i + 1}</span>
               <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface-muted)]">
                  {getArchiveAvatarSrc(m) ? <img src={getArchiveAvatarSrc(m) || undefined} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center font-ui text-xs font-black text-[var(--lcc-color-text-muted)]">{m.realName.charAt(0)}</div>}
               </div>
               <div className="min-w-0">
                  <span className="block break-words whitespace-normal font-ui text-xs font-black leading-tight text-[var(--lcc-color-text)]">{m.realName}</span>
                  <span className="mt-1 block break-words whitespace-normal font-ui text-[0.65rem] font-semibold leading-tight text-[var(--lcc-color-text-muted)]">{m.teamName} {m.year && `• ${m.year}`}</span>
               </div>
            </div>
            <div className="shrink-0 text-right">
               <span className="block font-ui text-sm font-black leading-none text-[var(--lcc-color-text)]">{val(m)}</span>
               <span className="font-ui text-[0.6rem] font-black uppercase leading-none text-[var(--lcc-color-text-muted)]">{label}</span>
            </div>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => setExp(isExp ? null : id)} aria-expanded={isExp} className="lcc2-button lcc2-button--secondary w-full rounded-none border-x-0 border-b-0">
        {isExp ? 'Show Less' : 'View Full Ranks'} {isExp ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
    </section>
  );
}

function getArchiveAvatarSrc(manager: any) {
  const owner = getLccOwnerBySleeperUserId(manager.id);
  return owner
    ? getOwnerImagePath(owner.id)
    : manager.avatar
      ? `https://sleepercdn.com/avatars/thumbs/${manager.avatar}`
      : null;
}
