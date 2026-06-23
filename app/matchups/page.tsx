'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Swords, Skull, Loader2, ChevronDown, X } from 'lucide-react';
import { LCC_MATCHUP_LEAGUE_IDS } from '@/lib/leagueConstants';

const LEAGUES = LCC_MATCHUP_LEAGUE_IDS;

export default function MatchupsPage() {
  const [activeTab, setActiveTab] = useState<'regular' | 'playoffs'>('regular');
  const [bracketType, setBracketType] = useState<'winners' | 'losers'>('winners');
  const [season, setSeason] = useState(2025);
  const [week, setWeek] = useState(1);
  const [loading, setLoading] = useState(true);
  
  const [matchups, setMatchups] = useState<any[]>([]);
  const [bracket, setBracket] = useState<any[]>([]);
  const [playoffScores, setPlayoffScores] = useState<any[]>([]);
  const [rosterMap, setRosterMap] = useState<Record<number, any>>({});
  const [playerMap, setPlayerMap] = useState<Record<string, any>>({});
  const [selectedMatchup, setSelectedMatchup] = useState<any | null>(null);

  const leagueId = LEAGUES[season as keyof typeof LEAGUES];

  // 1. Fetch Players, Users, and Rosters
  useEffect(() => {
    async function fetchBaseData() {
      try {
        const [uRes, rRes, pRes] = await Promise.all([
          fetch(`https://api.sleeper.app/v1/league/${leagueId}/users`),
          fetch(`https://api.sleeper.app/v1/league/${leagueId}/rosters`),
          fetch(`https://api.sleeper.app/v1/players/nfl`)
        ]);
        
        const users = await uRes.json();
        const rosters = await rRes.json();
        const players = await pRes.json();
        setPlayerMap(players);

        const map: any = {};
        rosters.forEach((r: any) => {
          const user = users.find((u: any) => u.user_id === r.owner_id);
          map[r.roster_id] = {
            name: user?.display_name || "Unknown",
            teamName: user?.metadata?.team_name || user?.display_name,
            avatar: user?.avatar ? `https://sleepercdn.com/avatars/thumbs/${user.avatar}` : null
          };
        });
        setRosterMap(map);
      } catch (err) { console.error("Base data error:", err); }
    }
    fetchBaseData();
  }, [season, leagueId]);

  // 2. Fetch Matchups and Brackets
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        if (activeTab === 'regular') {
          const res = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/matchups/${week}`);
          const data = await res.json();
          const pairs: any = {};
          data.forEach((m: any) => {
            if (!pairs[m.matchup_id]) pairs[m.matchup_id] = [];
            pairs[m.matchup_id].push(m);
          });
          setMatchups(Object.values(pairs));
        } else {
          const bUrl = `https://api.sleeper.app/v1/league/${leagueId}/${bracketType === 'winners' ? 'winners_bracket' : 'losers_bracket'}`;
          const [bRes, w15, w16, w17] = await Promise.all([
            fetch(bUrl),
            fetch(`https://api.sleeper.app/v1/league/${leagueId}/matchups/15`).then(r => r.json()),
            fetch(`https://api.sleeper.app/v1/league/${leagueId}/matchups/16`).then(r => r.json()),
            fetch(`https://api.sleeper.app/v1/league/${leagueId}/matchups/17`).then(r => r.json())
          ]);
          setBracket(await bRes.json());
          setPlayoffScores([...w15, ...w16, ...w17]);
        }
      } catch (err) { console.error("Load error:", err); }
      setLoading(false);
    }
    loadData();
  }, [activeTab, week, season, bracketType, leagueId]);

  return (
    <div className="min-h-screen bg-[#F9F7F2] font-serif text-[#1A472A] pb-24 text-center">
      <header className="py-12 bg-white border-b border-black/5 flex flex-col items-center sticky top-0 z-50 shadow-sm">
        <h1 className="text-4xl font-black italic uppercase mb-8">Matchup <span className="text-[#C5A059]">Center</span></h1>
        
        <div className="flex flex-wrap justify-center gap-4 mb-6">
          <div className="relative bg-[#F9F7F2] rounded-full px-6 py-2 border border-black/5 flex items-center gap-2">
            <select value={season} onChange={(e) => setSeason(Number(e.target.value))} className="appearance-none bg-transparent font-black uppercase text-[10px] outline-none pr-4 cursor-pointer">
              {Object.keys(LEAGUES).reverse().map(yr => <option key={yr} value={yr}>{yr} Season</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-4 pointer-events-none text-[#C5A059]" />
          </div>

          <div className="relative bg-[#F9F7F2] rounded-full px-6 py-2 border border-black/5 flex items-center gap-2">
            <select value={week} onChange={(e) => setWeek(Number(e.target.value))} className="appearance-none bg-transparent font-black uppercase text-[10px] outline-none pr-4 cursor-pointer">
              {activeTab === 'regular' 
                ? Array.from({length: 14}, (_, i) => <option key={i+1} value={i+1}>Week {i+1}</option>)
                : [15, 16, 17].map(w => <option key={w} value={w}>Week {w}</option>)
              }
            </select>
            <ChevronDown size={12} className="absolute right-4 pointer-events-none text-[#C5A059]" />
          </div>
        </div>

        <div className="flex bg-[#F9F7F2] p-1 rounded-full border border-black/5 mb-6">
          <button onClick={() => {setActiveTab('regular'); setWeek(1);}} className={`px-6 py-2 rounded-full text-[10px] font-black uppercase ${activeTab === 'regular' ? 'bg-[#1A472A] text-white shadow-md' : 'text-gray-400'}`}>Regular Season</button>
          <button onClick={() => {setActiveTab('playoffs'); setWeek(15);}} className={`px-6 py-2 rounded-full text-[10px] font-black uppercase ${activeTab === 'playoffs' ? 'bg-[#1A472A] text-white shadow-md' : 'text-gray-400'}`}>Playoffs</button>
        </div>

        {activeTab === 'playoffs' && (
          <div className="flex gap-4">
            <button onClick={() => setBracketType('winners')} className={`px-4 py-1 border rounded-xl text-[9px] font-black uppercase ${bracketType === 'winners' ? 'border-[#C5A059] bg-white shadow-sm' : 'opacity-40'}`}>Champions' Bracket</button>
            <button onClick={() => setBracketType('losers')} className={`px-4 py-1 border rounded-xl text-[9px] font-black uppercase ${bracketType === 'losers' ? 'border-red-200 bg-white shadow-sm' : 'opacity-40'}`}>Losers' Bracket</button>
          </div>
        )}
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {loading ? (
          <div className="flex flex-col items-center py-20 gap-4 opacity-30"><Loader2 className="animate-spin" /><p className="font-black uppercase text-[10px]">Syncing Archives...</p></div>
        ) : (
          <div className="grid gap-8">
            {activeTab === 'regular' ? (
              matchups.map((pair: any, i) => (
                <button key={i} onClick={() => setSelectedMatchup(pair)} className="bg-white p-10 rounded-[3rem] border border-black/5 flex items-center justify-between shadow-xl hover:scale-[1.01] transition-transform">
                  <TeamDisplay meta={rosterMap[pair[0]?.roster_id]} points={pair[0]?.points} />
                  <Swords size={32} className="opacity-10" />
                  <TeamDisplay meta={rosterMap[pair[1]?.roster_id]} points={pair[1]?.points} />
                </button>
              ))
            ) : (
              bracket.filter(m => (14 + m.r) === week).map((match: any, i) => {
                const s1 = playoffScores.find(s => s.roster_id === match.t1 && s.week === week);
                const s2 = playoffScores.find(s => s.roster_id === match.t2 && s.week === week);
                return (
                  <button key={i} onClick={() => setSelectedMatchup([s1, s2])} className={`bg-white p-10 rounded-[3rem] border flex items-center justify-between shadow-md relative ${week === 17 ? 'border-2 border-[#C5A059]' : 'border-black/5'}`}>
                    <span className="absolute -top-3 left-10 bg-[#F9F7F2] px-3 py-1 text-[8px] font-black uppercase border border-black/5 rounded-full">
                      {week === 15 ? 'Quarterfinals' : week === 16 ? 'Semifinals' : 'Championship'}
                    </span>
                    <PlayoffTeam meta={rosterMap[match.t1]} score={s1?.points} isWinner={match.w === match.t1} isFinals={week === 17} type={bracketType} />
                    {bracketType === 'winners' ? <Trophy size={32} className="opacity-10" /> : <Skull size={32} className="opacity-10" />}
                    <PlayoffTeam meta={rosterMap[match.t2]} score={s2?.points} isWinner={match.w === match.t2} isFinals={week === 17} type={bracketType} />
                  </button>
                );
              })
            )}
          </div>
        )}
      </main>

      {selectedMatchup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setSelectedMatchup(null)}>
          <div className="bg-white rounded-[3rem] w-full max-w-4xl p-12 relative shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedMatchup(null)} className="absolute top-8 right-8"><X /></button>
            <h2 className="text-2xl font-black italic uppercase mb-12 border-b pb-4 text-center">Box Score</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left">
              {selectedMatchup.map((team: any, idx: number) => (
                <div key={idx}>
                  <div className="flex items-center gap-4 mb-6 border-b pb-4">
                    <img src={rosterMap[team?.roster_id]?.avatar || '/managers/default.png'} className="w-12 h-12 rounded-full border-2 border-[#C5A059]" />
                    <div className="flex-1"><p className="font-black uppercase text-sm leading-none">{rosterMap[team?.roster_id]?.teamName}</p><p className="text-2xl font-black italic text-green-600">{team?.points?.toFixed(2)}</p></div>
                  </div>
                  <div className="space-y-2">
                    {team?.starters?.map((pid: string) => (
                      <div key={pid} className="flex justify-between items-center bg-[#F9F7F2] p-3 rounded-xl border border-black/5 text-[11px] font-black uppercase">
                        <div className="flex gap-3"><span>{playerMap[pid]?.position}</span><span>{playerMap[pid]?.first_name[0]}. {playerMap[pid]?.last_name}</span></div>
                        <span>{(team?.players_points?.[pid] || 0).toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-components for cleaner rendering
function TeamDisplay({ meta, points }: any) {
  return (
    <div className="flex-1 flex flex-col items-center">
      <img src={meta?.avatar || '/managers/default.png'} className="w-16 h-16 rounded-full mb-2 border-2 border-[#C5A059]" />
      <p className="text-[9px] font-black uppercase opacity-40 h-6">{meta?.teamName}</p>
      <p className="text-3xl font-black italic">{(points || 0).toFixed(2)}</p>
    </div>
  );
}

function PlayoffTeam({ meta, score, isWinner, isFinals, type }: any) {
  return (
    <div className="flex-1 flex flex-col items-center relative">
      {isFinals && isWinner && (type === 'winners' ? <Trophy className="absolute -top-8 text-[#C5A059] animate-bounce" size={24} /> : <span className="absolute -top-10 text-2xl">💩</span>)}
      <img src={meta?.avatar || '/managers/default.png'} className="w-14 h-14 rounded-full mb-2 border border-black/10" />
      <p className="text-[10px] font-black uppercase opacity-40">{meta?.teamName}</p>
      <p className="text-3xl font-black italic">{(score || 0).toFixed(2)}</p>
    </div>
  );
}
