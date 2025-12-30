'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ArrowLeft, Trophy, Loader2, Crown, TrendingUp, Zap, ChevronDown, ChevronUp,
  ArrowDown, History
} from 'lucide-react';
import { ModeToggle } from '@/components/ModeToggle';

// --- CONFIGURATION ---
const COMMISH_ID = "342828350391230464"; 
const START_YEAR = 2018;
const END_YEAR = 2025; 

// --- REAL NAME MAPPING (Master Key) ---
const REAL_NAMES: Record<string, string> = {
  "73400761740312576": "Doug Fordham",
  "341412060426436608": "Jordan Maslyn",
  "469199353672626176": "Landon Elliott",
  "342828350391230464": "Ray Long",
  "356621920969555968": "Jeffrey Hudgins",
  "342831451382841344": "Travis Miller",
  "342838548870762496": "Wade Cameron",
  "342849293037608960": "Tommy Moore",
  "342850391018356736": "JD Dowling",
  "343129212162523136": "Brian Stevens",
  "466663208728391680": "David Besedich",
  "583513420586848256": "Aaron Dogg",
  "864186418971418624": "Rashad Gresham",
  "1260048448384667648": "Stan Schoppe",
  "556676922517524480": "Adam Lind",
  "470428278931320832": "Billy Biddle",
  "345934777502699520": "Chris Barras",
  "98907192333582336": "Ricky Taylor",
  "342831898403377152": "Patrick Leahey"
};

// --- TYPES ---
interface ManagerStats {
  id: string;
  realName: string;
  teamName: string;
  avatar: string | null;
  wins: number;
  losses: number;
  ties: number;
  fpts: number;
  fpts_against: number;
  ppts: number;
  seasons: number;
}

interface SeasonRecord {
    id: string;
    realName: string;
    teamName: string;
    avatar: string | null;
    year: number;
    fpts: number;
}

// --- LEADERBOARD CARD COMPONENT: Fluid Scaling Fixes ---
const LeaderboardCard = ({ id, title, icon: Icon, data, valueKey, label, colorClass, expandedCard, setExpandedCard }: any) => {
    const isExpanded = expandedCard === id;
    const displayData = isExpanded ? data : data.slice(0, 5);

    return (
      <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm flex flex-col h-full">
        <div className={`p-4 sm:p-5 ${colorClass} bg-opacity-10 dark:bg-opacity-20 flex items-center gap-3 border-b border-gray-100 dark:border-white/5`}>
          <div className={`p-2 rounded-lg ${colorClass} text-white shadow-sm shrink-0`}>
            <Icon className="w-5 h-5" />
          </div>
          <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-wider text-xs sm:text-sm truncate">{title}</h3>
        </div>
        
        <div className="divide-y divide-gray-100 dark:divide-white/5 flex-grow">
          {displayData.map((manager: any, i: number) => (
            <div key={`${manager.id}-${manager.year || 'all'}`} className="p-3 sm:p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
                 <span className={`font-mono font-bold text-xs sm:text-sm w-4 sm:w-5 text-center shrink-0 ${i === 0 ? 'text-yellow-500' : 'text-gray-400'}`}>{i + 1}</span>
                 <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden relative border border-gray-100 dark:border-white/10 shrink-0">
                    {manager.avatar ? (
                        <Image src={`https://sleepercdn.com/avatars/thumbs/${manager.avatar}`} alt={manager.teamName} fill className="object-cover" unoptimized />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-gray-400 text-xs">{manager.realName.charAt(0)}</div>
                    )}
                 </div>
                 <div className="flex flex-col min-w-0">
                    <span className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm leading-tight truncate">{manager.realName}</span>
                    <div className="flex items-center gap-1">
                        <span className="text-[9px] sm:text-[10px] text-gray-400 uppercase truncate max-w-[80px] sm:max-w-none">{manager.teamName}</span>
                        {manager.year && <span className="text-[8px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-500 font-bold shrink-0">{manager.year}</span>}
                    </div>
                 </div>
              </div>
              <div className="text-right shrink-0">
                 <span className="block font-black text-xs sm:text-base text-gray-900 dark:text-white">{valueKey(manager)}</span>
                 <span className="text-[8px] sm:text-[10px] text-gray-400 uppercase font-bold leading-none">{label}</span>
              </div>
            </div>
          ))}
        </div>

        <button 
            onClick={() => setExpandedCard(isExpanded ? null : id)}
            className="w-full py-3 bg-gray-50 dark:bg-white/5 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] hover:bg-gray-100 dark:hover:bg-white/10 transition-colors flex items-center justify-center gap-1 border-t border-gray-100 dark:border-white/5"
        >
            {isExpanded ? (
                <>Show Less <ChevronUp className="w-3 h-3" /></>
            ) : (
                <>View All <ChevronDown className="w-3 h-3" /></>
            )}
        </button>
      </div>
    );
};

export default function ArchivesPage() {
  const [stats, setStats] = useState<ManagerStats[]>([]);
  const [seasonRecords, setSeasonRecords] = useState<SeasonRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState("");
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      const aggregated: Record<string, ManagerStats> = {};
      const allSeasonsList: SeasonRecord[] = [];
      const masterUserMap: Record<string, { name: string, avatar: string }> = {};
      
      try {
        for (let year = END_YEAR; year >= START_YEAR; year--) {
            setProgress(`Analyzing ${year} Season...`);
            
            const leagueRes = await fetch(`https://api.sleeper.app/v1/user/${COMMISH_ID}/leagues/nfl/${year}`);
            const leagues = await leagueRes.json();
            const myLeague = leagues.find((l: any) => l.name.includes("River City"));

            if (!myLeague) continue;

            const [rostersRes, usersRes] = await Promise.all([
                fetch(`https://api.sleeper.app/v1/league/${myLeague.league_id}/rosters`),
                fetch(`https://api.sleeper.app/v1/league/${myLeague.league_id}/users`)
            ]);

            const rosters = await rostersRes.json();
            const users = await usersRes.json();

            users.forEach((u: any) => {
                if (!masterUserMap[u.user_id]) {
                    masterUserMap[u.user_id] = {
                        name: u.metadata?.team_name || u.display_name,
                        avatar: u.avatar
                    };
                }
            });

            rosters.forEach((r: any) => {
                const uid = r.owner_id;
                if (!uid) return;

                const userProfile = masterUserMap[uid] || { name: "Unknown", avatar: null };
                const teamName = userProfile.name;
                const realName = REAL_NAMES[uid] || teamName; 

                if (!aggregated[uid]) {
                    aggregated[uid] = {
                        id: uid, realName, teamName, avatar: userProfile.avatar,
                        wins: 0, losses: 0, ties: 0, fpts: 0, fpts_against: 0, ppts: 0, seasons: 0
                    };
                } else {
                    if (userProfile.avatar) aggregated[uid].avatar = userProfile.avatar;
                    if (teamName !== "Unknown") aggregated[uid].teamName = teamName;
                }

                aggregated[uid].wins += r.settings.wins;
                aggregated[uid].losses += r.settings.losses;
                aggregated[uid].ties += r.settings.ties;
                aggregated[uid].fpts += r.settings.fpts + (r.settings.fpts_decimal || 0) / 100;
                aggregated[uid].fpts_against += r.settings.fpts_against + (r.settings.fpts_against_decimal || 0) / 100;
                aggregated[uid].ppts += r.settings.ppts + (r.settings.ppts_decimal || 0) / 100;
                aggregated[uid].seasons += 1;
                
                if (r.settings.fpts > 0) {
                    allSeasonsList.push({
                        id: uid,
                        realName: realName,
                        teamName: teamName,
                        avatar: userProfile.avatar,
                        year: year,
                        fpts: r.settings.fpts + (r.settings.fpts_decimal || 0) / 100
                    });
                }
            });
        }

        setStats(Object.values(aggregated));
        setSeasonRecords(allSeasonsList);

      } catch (error) {
        console.error("Archive Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212] transition-colors duration-300 font-sans selection:bg-orange-500 selection:text-white pb-20">
      
      {/* HEADER: RESPONSIVE PADDING & SCALING */}
      <div className="pt-6 sm:pt-8 px-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link href="/league-info" className="flex items-center gap-1 sm:gap-2 text-gray-500 hover:text-orange-600 transition-colors font-black text-[10px] sm:text-xs uppercase tracking-widest">
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" /> Hub
          </Link>
          <ModeToggle />
        </div>
        
        <div className="mb-8">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white mb-2 tracking-tighter uppercase leading-none">League <span className="text-orange-600">Archives</span></h1>
            <p className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400 font-black uppercase tracking-[0.2em]">Sleeper Data ({START_YEAR}–{END_YEAR})</p>
        </div>
      </div>

      {/* CONTENT AREA: RESPONSIVE GRID */}
      <main className="px-4 max-w-7xl mx-auto">
        {loading ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-50">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
              <p className="font-black text-gray-500 uppercase tracking-widest text-[10px] sm:text-xs animate-pulse">{progress}</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 animate-in fade-in duration-500">
                
                <LeaderboardCard 
                    id="wins" title="All-Time Wins" icon={Trophy} colorClass="bg-yellow-500"
                    data={[...stats].sort((a,b) => b.wins - a.wins)}
                    valueKey={(m: any) => m.wins} label="Wins"
                    expandedCard={expandedCard} setExpandedCard={setExpandedCard}
                />

                <LeaderboardCard 
                    id="points" title="All-Time Points" icon={TrendingUp} colorClass="bg-green-500"
                    data={[...stats].sort((a,b) => b.fpts - a.fpts)}
                    valueKey={(m: any) => m.fpts.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    label="Points"
                    expandedCard={expandedCard} setExpandedCard={setExpandedCard}
                />

                <LeaderboardCard 
                    id="best_season" title="Best Season" icon={History} colorClass="bg-orange-500"
                    data={[...seasonRecords].sort((a,b) => b.fpts - a.fpts)}
                    valueKey={(m: any) => m.fpts.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    label="Points"
                    expandedCard={expandedCard} setExpandedCard={setExpandedCard}
                />

                <LeaderboardCard 
                    id="worst_season" title="Lowest Season" icon={ArrowDown} colorClass="bg-red-500"
                    data={[...seasonRecords].filter(m => m.fpts > 500).sort((a,b) => a.fpts - b.fpts)} 
                    valueKey={(m: any) => m.fpts.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    label="Points"
                    expandedCard={expandedCard} setExpandedCard={setExpandedCard}
                />

                <LeaderboardCard 
                    id="winpct" title="Best Win %" icon={Crown} colorClass="bg-purple-500"
                    data={[...stats].filter(s => s.seasons >= 2).sort((a,b) => {
                        const pctA = a.wins / (a.wins + a.losses + a.ties);
                        const pctB = b.wins / (b.wins + b.losses + b.ties);
                        return pctB - pctA;
                    })}
                    valueKey={(m: any) => ((m.wins / (m.wins + m.losses + m.ties)) * 100).toFixed(1) + "%"}
                    label="Win Pct"
                    expandedCard={expandedCard} setExpandedCard={setExpandedCard}
                />

                <LeaderboardCard 
                    id="efficiency" title="Lineup Efficiency" icon={Zap} colorClass="bg-blue-500"
                    data={[...stats].filter(s => s.ppts > 0).sort((a,b) => (b.fpts/b.ppts) - (a.fpts/a.ppts))}
                    valueKey={(m: any) => ((m.fpts / m.ppts) * 100).toFixed(1) + "%"}
                    label="Start %"
                    expandedCard={expandedCard} setExpandedCard={setExpandedCard}
                />

            </div>
        )}
      </main>
    </div>
  );
}