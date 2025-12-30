'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ArrowLeft, ChevronDown, Loader2, RefreshCw
} from 'lucide-react';
import { ModeToggle } from '@/components/ModeToggle';

const COMMISH_ID = "342828350391230464"; 
const START_YEAR = 2018;
const CURRENT_YEAR = 2025;

export default function DraftBoardPage() {
  const [selectedYear, setSelectedYear] = useState<number>(CURRENT_YEAR);
  const [draftData, setDraftData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchDraft() {
      setLoading(true);
      setDraftData(null); 
      try {
        const leagueRes = await fetch(`https://api.sleeper.app/v1/user/${COMMISH_ID}/leagues/nfl/${selectedYear}`);
        if (!leagueRes.ok) throw new Error('Failed to fetch leagues');
        const leagues = await leagueRes.json();
        const myLeague = leagues.find((l: any) => l.name.includes("River City"));
        if (!myLeague) { setDraftData(null); setLoading(false); return; }

        const draftId = myLeague.draft_id;
        const [picksRes, usersRes, draftInfoRes] = await Promise.all([
            fetch(`https://api.sleeper.app/v1/draft/${draftId}/picks`),
            fetch(`https://api.sleeper.app/v1/league/${myLeague.league_id}/users`),
            fetch(`https://api.sleeper.app/v1/draft/${draftId}`)
        ]);

        const picks = await picksRes.json();
        const users = await usersRes.json();
        const draftInfo = await draftInfoRes.json();

        const totalRounds = draftInfo.settings.rounds;
        const draftOrder = draftInfo.draft_order || {}; 
        const getUser = (id: string) => users.find((u: any) => u.user_id === id);

        let teams: any[] = [];
        if (Object.keys(draftOrder).length > 0) {
            const sortedUserIds = Object.keys(draftOrder).sort((a, b) => draftOrder[a] - draftOrder[b]);
            teams = sortedUserIds.map(userId => {
                const user = getUser(userId);
                const slot = draftOrder[userId];
                const teamPicks = picks.filter((p: any) => p.picked_by === userId);
                return {
                    id: userId,
                    slot: slot,
                    name: user?.metadata?.team_name || user?.display_name || `Team ${slot}`,
                    avatar: user?.avatar,
                    picks: teamPicks
                };
            });
        } 

        setDraftData({ teams, rounds: totalRounds, hasPicks: picks.length > 0 });
      } catch (err) { console.error(err); setDraftData(null); } finally { setLoading(false); }
    }
    fetchDraft();
  }, [selectedYear]);

  const getPositionColor = (pos: string) => {
    switch (pos) {
      case 'QB': return 'bg-red-100 dark:bg-red-900/40 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100';
      case 'RB': return 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100';
      case 'WR': return 'bg-sky-100 dark:bg-sky-900/40 border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-100';
      case 'TE': return 'bg-amber-100 dark:bg-amber-900/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100';
      case 'K':  return 'bg-purple-100 dark:bg-purple-900/40 border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-100';
      case 'DEF': return 'bg-stone-200 dark:bg-stone-700 border-stone-300 dark:border-stone-600 text-stone-900 dark:text-stone-100';
      default: return 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500';
    }
  };

  const getPlayerImage = (pick: any) => {
    if (pick.metadata.position === 'DEF') return `https://sleepercdn.com/images/team_logos/nfl/${pick.player_id.toLowerCase()}.png`;
    return `https://sleepercdn.com/content/nfl/players/${pick.player_id}.jpg`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212] transition-colors duration-300 font-sans pb-12 selection:bg-orange-500">
      
      {/* HEADER: Fluid scaling for small screens */}
      <div className="bg-white dark:bg-[#1e1e1e] border-b border-gray-200 dark:border-white/5 pb-4 pt-4 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 relative flex flex-col items-center">
            <Link href="/league-info" className="absolute top-4 left-2 sm:left-4 flex items-center gap-1 text-gray-500 hover:text-orange-600 transition-colors font-bold text-[10px] sm:text-xs uppercase tracking-widest">
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" /> Hub
            </Link>
            <div className="absolute top-4 right-2 sm:right-4 z-50 scale-75 sm:scale-100"><ModeToggle /></div>
            
            <div className="flex items-center gap-2 sm:gap-3 mb-3">
                <div className="h-8 w-8 sm:h-12 sm:w-12 rounded-full border-2 border-orange-500 overflow-hidden relative shadow-sm">
                    <Image src="/River City FFL Logo.JPG" alt="Logo" fill className="object-cover" priority unoptimized />
                </div>
                <h1 className="text-xl sm:text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">
                    Draft <span className="text-orange-600">Board</span>
                </h1>
            </div>

            <div className="relative inline-block bg-gray-100 dark:bg-[#2c2c2c] rounded-full shadow-inner px-3 sm:px-4 py-1 border border-gray-200 dark:border-white/5">
                <select 
                    value={selectedYear} 
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="appearance-none bg-transparent text-gray-900 dark:text-white font-bold text-[10px] sm:text-sm pr-5 sm:pr-6 focus:outline-none cursor-pointer"
                >
                    {Array.from({ length: CURRENT_YEAR - START_YEAR + 1 }, (_, i) => CURRENT_YEAR - i).map(year => (
                        <option key={year} value={year}>{year} Season</option>
                    ))}
                </select>
                <ChevronDown className="w-3 h-3 absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
        </div>
      </div>

      {/* DRAFT GRID: Horizontal scroll wrapper for mobile */}
      <main className="w-full overflow-x-auto custom-scrollbar">
        {loading ? (
            <div className="flex flex-col items-center justify-center py-32 opacity-50">
                <Loader2 className="w-10 h-10 animate-spin text-orange-600 mb-4" />
                <p className="font-bold text-gray-500 animate-pulse text-xs uppercase tracking-widest">Scanning History...</p>
            </div>
        ) : !draftData || !draftData.teams ? (
            <div className="text-center py-20 text-gray-400 font-bold uppercase tracking-widest text-xs">
                No draft found for {selectedYear}
            </div>
        ) : (
            <div className="p-4 inline-block min-w-full">
                <div className="flex gap-2">
                    {draftData.teams.map((team: any) => (
                        <div key={team.id} className="w-28 sm:w-36 shrink-0 flex flex-col gap-2">
                            
                            {/* TEAM HEADER: Scaled down for mobile */}
                            <div className="bg-white dark:bg-[#1e1e1e] p-2 rounded-xl border-b-4 border-orange-500 text-center h-20 sm:h-24 flex flex-col items-center justify-center relative shadow-sm border border-gray-100 dark:border-white/5">
                                <div className="absolute top-1 left-1.5 text-[8px] font-black text-gray-400 uppercase tracking-tighter">#{team.slot}</div>
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-50 dark:bg-black/20 overflow-hidden relative mb-1 border border-gray-200 dark:border-white/10">
                                    {team.avatar ? (
                                        <Image src={`https://sleepercdn.com/avatars/thumbs/${team.avatar}`} alt={team.name} fill className="object-cover" unoptimized />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-400">{team.name[0]}</div>
                                    )}
                                </div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-[9px] sm:text-[11px] leading-tight line-clamp-2 px-1 w-full uppercase tracking-tighter">
                                    {team.name}
                                </h3>
                            </div>

                            {/* PICKS: Fluid layout for pick cards */}
                            <div className="flex flex-col gap-1.5">
                                {team.picks.length > 0 ? (
                                    team.picks.map((pick: any) => (
                                        <div key={pick.pick_no} className={`relative rounded-xl p-2 border shadow-sm transition-all hover:scale-[1.03] active:scale-95 ${getPositionColor(pick.metadata.position)}`}>
                                            <div className="absolute -top-1 -right-1 bg-black text-white text-[7px] sm:text-[8px] font-bold px-1.5 py-0.5 rounded-lg shadow-sm z-10 border border-white/10 uppercase tracking-tighter">
                                                {pick.round}.{String(pick.draft_slot).padStart(2, '0')}
                                            </div>
                                            <div className="flex flex-col items-center text-center gap-1">
                                                <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-white/50 shadow-inner bg-gray-50">
                                                    <Image 
                                                        src={getPlayerImage(pick)}
                                                        alt="P" fill unoptimized className="object-cover"
                                                        onError={(e: any) => { e.target.src = "https://sleepercdn.com/images/v2/icons/player_default.webp" }}
                                                    />
                                                </div>
                                                <div className="w-full px-0.5">
                                                    <div className="text-[9px] sm:text-[10px] font-black leading-none truncate w-full uppercase tracking-tighter">
                                                        {pick.metadata.first_name[0]}. {pick.metadata.last_name}
                                                    </div>
                                                    <div className="text-[7px] sm:text-[8px] font-bold opacity-60 uppercase tracking-tighter mt-1">
                                                        {pick.metadata.position} • {pick.metadata.team || 'FA'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="h-32 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl flex items-center justify-center text-center p-4">
                                        <span className="text-[10px] text-gray-400 font-bold uppercase opacity-50 tracking-widest">
                                            {draftData.hasPicks ? "No Picks" : "Wait..."}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(249, 115, 22, 0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  );
}