'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ChevronDown, Loader2 } from 'lucide-react';

const COMMISH_ID = "342828350391230464"; 
const START_YEAR = 2019;
const CURRENT_YEAR = 2025;

export default function DraftBoardPage() {
  const [selectedYear, setSelectedYear] = useState<number>(CURRENT_YEAR);
  const [draftType, setDraftType] = useState<'veteran' | 'rookie'>('rookie');
  const [draftData, setDraftData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchDraft() {
      setLoading(true);
      setDraftData(null); 
      try {
        const leagueRes = await fetch(`https://api.sleeper.app/v1/user/${COMMISH_ID}/leagues/nfl/${selectedYear}`);
        const leagues = await leagueRes.json();
        
        const myLeague = leagues.find((l: any) => l.name.toLowerCase().includes("long country") || l.name.toLowerCase().includes("lcc"));
        if (!myLeague) { setDraftData(null); setLoading(false); return; }

        let draftId = myLeague.draft_id;
        
        if (selectedYear === 2021) {
            const allDraftsRes = await fetch(`https://api.sleeper.app/v1/league/${myLeague.league_id}/drafts`);
            const allDrafts = await allDraftsRes.json();
            const vetDraft = allDrafts.find((d: any) => d.settings.rounds > 10);
            const rookDraft = allDrafts.find((d: any) => d.settings.rounds <= 5);
            draftId = draftType === 'veteran' ? vetDraft?.draft_id : rookDraft?.draft_id;
        }

        const [picksRes, usersRes, draftInfoRes] = await Promise.all([
            fetch(`https://api.sleeper.app/v1/draft/${draftId}/picks`),
            fetch(`https://api.sleeper.app/v1/league/${myLeague.league_id}/users`),
            fetch(`https://api.sleeper.app/v1/draft/${draftId}`)
        ]);

        const picks = await picksRes.json();
        const users = await usersRes.json();
        const draftInfo = await draftInfoRes.json();

        // FIX: Instead of relying purely on draft_order, we find all unique picker IDs
        // This ensures teams that made picks but aren't in the "order" object still show up.
        const uniquePickerIds = Array.from(new Set(picks.map((p: any) => p.picked_by)));
        
        // Sort them by their first pick slot to keep the board in order
        const teams = uniquePickerIds.map(userId => {
            const user = users.find((u: any) => u.user_id === userId);
            const teamPicks = picks.filter((p: any) => p.picked_by === userId);
            const firstPick = teamPicks.sort((a: any, b: any) => a.pick_no - b.pick_no)[0];

            return {
                id: userId,
                slot: firstPick?.draft_slot || 0,
                name: user?.metadata?.team_name || user?.display_name || `Team ${userId}`,
                avatar: user?.avatar,
                picks: teamPicks
            };
        }).sort((a, b) => a.slot - b.slot);

        setDraftData({ teams, rounds: draftInfo.settings.rounds });
      } catch (err) { console.error(err); } finally { setLoading(false); }
    }
    fetchDraft();
  }, [selectedYear, draftType]);

  const getPosColor = (pos: string) => {
    switch (pos) {
      case 'QB': return 'bg-red-50 border-red-200 text-red-900';
      case 'RB': return 'bg-emerald-50 border-emerald-200 text-emerald-900';
      case 'WR': return 'bg-sky-50 border-sky-200 text-sky-900';
      case 'TE': return 'bg-amber-50 border-amber-200 text-amber-900';
      default: return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F7F2] font-serif pb-12">
      <div className="bg-white border-b border-black/5 pb-6 pt-6 sticky top-0 z-50 shadow-sm text-center">
        <Link href="/league-info" className="absolute left-6 top-8 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[#1A472A]">
            <ArrowLeft className="w-4 h-4" /> Hub
        </Link>
        
        <div className="flex flex-col items-center gap-4">
            <h1 className="text-2xl font-black italic uppercase tracking-tighter text-[#1A472A]">
                LCC <span className="text-[#C5A059]">Draft Board</span>
            </h1>

            <div className="flex gap-4">
                <div className="relative bg-[#F9F7F2] rounded-full px-6 py-2 border border-black/5">
                    <select 
                        value={selectedYear} 
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="appearance-none bg-transparent font-black text-[10px] uppercase tracking-widest outline-none pr-4 cursor-pointer"
                    >
                        {Array.from({ length: CURRENT_YEAR - START_YEAR + 1 }, (_, i) => CURRENT_YEAR - i).map(y => (
                            <option key={y} value={y}>{y} Season</option>
                        ))}
                    </select>
                    <ChevronDown className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>

                {selectedYear === 2021 && (
                    <div className="flex bg-[#F9F7F2] rounded-full p-1 border border-black/5">
                        <button onClick={() => setDraftType('veteran')} className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${draftType === 'veteran' ? 'bg-[#1A472A] text-white shadow-md' : 'text-gray-400'}`}>Veteran</button>
                        <button onClick={() => setDraftType('rookie')} className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${draftType === 'rookie' ? 'bg-[#1A472A] text-white shadow-md' : 'text-gray-400'}`}>Rookie</button>
                    </div>
                )}
            </div>
        </div>
      </div>

      <main className="w-full overflow-x-auto p-6">
        {loading ? (
            <div className="flex flex-col items-center justify-center py-32">
                <Loader2 className="w-10 h-10 animate-spin text-[#1A472A] mb-4" />
                <p className="font-black text-[10px] uppercase tracking-widest opacity-40">Reconstructing History...</p>
            </div>
        ) : draftData?.teams ? (
            <div className="inline-flex gap-4">
                {draftData.teams.map((team: any) => (
                    <div key={team.id} className="w-32 sm:w-44 shrink-0 flex flex-col gap-4">
                        <div className="bg-white p-4 rounded-3xl border-b-4 border-[#C5A059] text-center shadow-sm border border-black/5 h-28 flex flex-col items-center justify-center">
                            <p className="text-[8px] font-black text-[#C5A059] mb-1">SLOT {team.slot}</p>
                            <h3 className="font-black text-[10px] uppercase leading-tight line-clamp-2 text-[#1A472A]">{team.name}</h3>
                        </div>

                        <div className="flex flex-col gap-2">
                            {team.picks.map((pick: any) => (
                                <div key={pick.pick_no} className={`p-3 rounded-2xl border shadow-sm ${getPosColor(pick.metadata.position)}`}>
                                    <p className="text-[8px] font-black mb-2 opacity-40">{pick.round}.{pick.draft_slot}</p>
                                    <div className="relative w-12 h-12 rounded-full overflow-hidden mx-auto mb-2 border-2 border-white shadow-sm bg-white">
                                        <img 
                                            src={pick.metadata.position === 'DEF' 
                                                ? `https://sleepercdn.com/images/team_logos/nfl/${pick.player_id.toLowerCase()}.png`
                                                : `https://sleepercdn.com/content/nfl/players/${pick.player_id}.jpg`}
                                            alt="P" className="object-cover"
                                            onError={(e: any) => { e.target.src = "https://sleepercdn.com/images/v2/icons/player_default.webp" }}
                                        />
                                    </div>
                                    <p className="text-[9px] font-black uppercase tracking-tighter truncate">{pick.metadata.first_name[0]}. {pick.metadata.last_name}</p>
                                    <p className="text-[7px] font-bold opacity-60 uppercase">{pick.metadata.position} • {pick.metadata.team}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-center py-32 font-black uppercase text-[10px] opacity-30">No Draft Data Found</div>
        )}
      </main>
    </div>
  );
}