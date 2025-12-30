'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Trophy, Users, BookOpen, Swords, ArrowLeft, ChevronLeft, ChevronRight, 
  Loader2, Calendar, Crown, X
} from 'lucide-react';
import { ModeToggle } from '@/components/ModeToggle';
import { 
  getMatchups, 
  getLeagueRosters, 
  getLeagueUsers, 
  getWinnersBracket, 
  getLosersBracket,
  getAllPlayers
} from '@/lib/sleeper';

export default function MatchupsPage() {
  const [activeTab, setActiveTab] = useState<'regular' | 'playoffs'>('regular');
  const [currentWeek, setCurrentWeek] = useState(1);
  
  // Data State
  const [matchups, setMatchups] = useState<any[]>([]);
  const [winnersBracket, setWinnersBracket] = useState<any[]>([]);
  const [losersBracket, setLosersBracket] = useState<any[]>([]);
  
  // Playoff Score Data (Weeks 15-17)
  const [playoffData, setPlayoffData] = useState<Record<number, any[]>>({}); 

  const [rosterMap, setRosterMap] = useState<Record<number, any>>({});
  const [nflPlayers, setNflPlayers] = useState<Record<string, any>>({});
  
  const [loading, setLoading] = useState(true);
  const [loadingBracket, setLoadingBracket] = useState(false);
  const [selectedMatchup, setSelectedMatchup] = useState<any[] | null>(null);

  // 1. Fetch Base Data (Users, Rosters, Players)
  useEffect(() => {
    async function fetchBaseData() {
      try {
        const [users, rosters, players] = await Promise.all([
          getLeagueUsers(),
          getLeagueRosters(),
          getAllPlayers()
        ]);

        const userMap: Record<string, any> = {};
        users.forEach((u: any) => {
            userMap[u.user_id] = {
                name: u.display_name,
                avatar: u.avatar,
                teamName: u.metadata?.team_name || u.display_name
            };
        });

        const map: Record<number, any> = {};
        rosters.forEach((r: any) => {
            const user = userMap[r.owner_id];
            map[r.roster_id] = {
                name: user?.name || "Unknown",
                avatar: user?.avatar ? `https://sleepercdn.com/avatars/thumbs/${user.avatar}` : null,
                teamName: user?.teamName || "Unknown Team",
                wins: r.settings.wins,
                losses: r.settings.losses,
                fpts: r.settings.fpts,
                seed: r.settings.wins 
            };
        });
        setRosterMap(map);
        setNflPlayers(players);
      } catch (error) {
        console.error("Error loading base data:", error);
      }
    }
    fetchBaseData();
  }, []);

  // 2. Fetch Regular Season Matchups
  useEffect(() => {
    async function fetchMatchupsData() {
      if (activeTab !== 'regular') return;
      setLoading(true);
      try {
        const data = await getMatchups(currentWeek);
        setMatchups(data);
      } catch (error) {
        console.error("Error loading matchups:", error);
      } finally {
        setLoading(false);
      }
    }
    if (Object.keys(rosterMap).length > 0) {
        fetchMatchupsData();
    }
  }, [currentWeek, rosterMap, activeTab]);

  // 3. Fetch Brackets & Playoff Scores (Weeks 15, 16, 17)
  useEffect(() => {
    async function fetchBracketsAndScores() {
      if (activeTab !== 'playoffs' || winnersBracket.length > 0) return;
      setLoadingBracket(true);
      try {
        const [w, l, week15, week16, week17] = await Promise.all([
            getWinnersBracket(),
            getLosersBracket(),
            getMatchups(15),
            getMatchups(16),
            getMatchups(17)
        ]);
        setWinnersBracket(w);
        setLosersBracket(l);
        setPlayoffData({
            15: week15,
            16: week16,
            17: week17
        });
      } catch (error) {
        console.error("Error fetching brackets:", error);
      } finally {
        setLoadingBracket(false);
      }
    }
    fetchBracketsAndScores();
  }, [activeTab, winnersBracket.length]);

  const renderBracketMatch = (match: any, roundLabel: string) => {
    const t1Meta = rosterMap[match.t1];
    const t2Meta = rosterMap[match.t2];
    const weekNum = 14 + match.r; 
    const weekScores = playoffData[weekNum] || [];
    const t1ScoreObj = weekScores.find((m: any) => m.roster_id === match.t1) || { points: 0, starters: [] };
    const t2ScoreObj = weekScores.find((m: any) => m.roster_id === match.t2) || { points: 0, starters: [] };
    const scoreA = t1ScoreObj.points || 0;
    const scoreB = t2ScoreObj.points || 0;
    const matchupPair = [{ ...t1ScoreObj, roster_id: match.t1 }, { ...t2ScoreObj, roster_id: match.t2 }];

    return (
      <button 
        key={match.m} 
        onClick={() => { if (match.t1 && match.t2) setSelectedMatchup(matchupPair); }}
        className="w-full bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-sm mb-4 hover:shadow-md transition-all text-left group shrink-0"
      >
        <div className="bg-gray-50 dark:bg-white/5 px-3 py-1.5 text-[10px] uppercase font-bold text-gray-400 border-b border-gray-100 dark:border-white/5 flex justify-between group-hover:text-orange-500 transition-colors">
            <span>{roundLabel} • Wk {weekNum}</span>
            <span>M{match.m}</span>
        </div>
        <div className={`flex items-center justify-between p-2.5 border-b border-gray-100 dark:border-white/5 ${match.w === match.t1 && match.w ? 'bg-green-50/50 dark:bg-green-900/10' : ''}`}>
            <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden relative shrink-0">
                    {t1Meta?.avatar ? <Image src={t1Meta.avatar} alt="T1" fill className="object-cover" unoptimized /> : <span className="flex items-center justify-center h-full text-[10px] font-bold">?</span>}
                </div>
                <div className="text-[11px] font-bold dark:text-white truncate max-w-[90px]">{t1Meta?.teamName || "TBD"}</div>
            </div>
            <span className={`font-mono font-bold text-xs ${match.w === match.t1 ? 'text-green-600' : 'text-gray-400'}`}>{scoreA > 0 ? scoreA.toFixed(1) : '-'}</span>
        </div>
        <div className={`flex items-center justify-between p-2.5 ${match.w === match.t2 && match.w ? 'bg-green-50/50 dark:bg-green-900/10' : ''}`}>
            <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden relative shrink-0">
                    {t2Meta?.avatar ? <Image src={t2Meta.avatar} alt="T2" fill className="object-cover" unoptimized /> : <span className="flex items-center justify-center h-full text-[10px] font-bold">?</span>}
                </div>
                <div className="text-[11px] font-bold dark:text-white truncate max-w-[90px]">{t2Meta?.teamName || "TBD"}</div>
            </div>
            <span className={`font-mono font-bold text-xs ${match.w === match.t2 ? 'text-green-600' : 'text-gray-400'}`}>{scoreB > 0 ? scoreB.toFixed(1) : '-'}</span>
        </div>
      </button>
    );
  };

  const groupMatchesByRound = (bracket: any[]) => {
    const rounds: Record<number, any[]> = {};
    bracket.forEach(m => {
        if (!rounds[m.r]) rounds[m.r] = [];
        rounds[m.r].push(m);
    });
    return rounds;
  };

  const winnersRounds = groupMatchesByRound(winnersBracket);
  const losersRounds = groupMatchesByRound(losersBracket);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212] transition-colors duration-300 font-sans selection:bg-orange-500 selection:text-white">
      
      {/* HEADER: RESPONSIVE NAV */}
      <header className="border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] pb-6 sm:pb-8 pt-4 shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 text-center relative flex flex-col items-center">
          <div className="absolute top-4 left-2 sm:left-4 z-50">
            <Link href="/" className="flex items-center gap-1 text-gray-500 hover:text-orange-600 transition-colors font-bold text-[10px] sm:text-sm uppercase tracking-widest">
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" /> Home
            </Link>
          </div>
          <div className="absolute top-4 right-2 sm:right-4 z-50 scale-75 sm:scale-100"><ModeToggle /></div>
          
          <div className="mx-auto mb-3 sm:mb-4 flex h-14 w-14 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-white shadow-xl border-2 sm:border-4 border-gray-100 dark:border-white/10 overflow-hidden relative">
             <Image src="/River City FFL Logo.JPG" alt="Logo" fill className="object-cover" priority unoptimized />
          </div>
          <h1 className="mb-4 text-xl sm:text-4xl font-extrabold tracking-tighter text-gray-900 dark:text-[#f0c340] uppercase leading-none">
            League <span className="text-orange-600 dark:text-white">Matchups</span>
          </h1>
          
          <nav className="flex flex-wrap justify-center gap-2 sm:gap-4 relative z-40 mb-5 px-2">
            {[
              { label: 'Home', href: '/', icon: Trophy },
              { label: 'Managers', href: '/managers', icon: Users },
              { label: 'Info', href: '/league-info', icon: BookOpen },
              { label: 'Matchups', href: '/matchups', icon: Swords }
            ].map((item, i) => (
              <Link key={i} href={item.href} className={`px-4 sm:px-6 py-1.5 sm:py-2 rounded-full border text-[10px] sm:text-sm flex items-center gap-1.5 font-bold transition-all ${item.label === 'Matchups' ? 'bg-orange-600 text-white border-transparent shadow-lg' : 'bg-white dark:bg-[#2c2c2c] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10'}`}>
                <item.icon className="w-3 h-3 sm:w-4 sm:h-4" /> {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex justify-center gap-2 relative z-40">
             <button onClick={() => setActiveTab('regular')} className={`px-4 sm:px-6 py-1.5 sm:py-2 rounded-full font-bold text-[10px] sm:text-xs transition-all ${activeTab === 'regular' ? 'bg-orange-600 text-white shadow-lg' : 'bg-gray-100 dark:bg-white/10 text-gray-500'}`}>Regular Season</button>
             <button onClick={() => setActiveTab('playoffs')} className={`px-4 sm:px-6 py-1.5 sm:py-2 rounded-full font-bold text-[10px] sm:text-xs transition-all ${activeTab === 'playoffs' ? 'bg-orange-600 text-white shadow-lg' : 'bg-gray-100 dark:bg-white/10 text-gray-500'}`}>Playoffs</button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 sm:py-12 max-w-6xl">
        
        {activeTab === 'regular' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center justify-center gap-4 sm:gap-6 mb-8 sm:mb-10">
                    <button onClick={() => setCurrentWeek(prev => Math.max(1, prev - 1))} disabled={currentWeek === 1} className="p-2 rounded-full bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-white/10 disabled:opacity-30"><ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" /></button>
                    <div className="text-center">
                        <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white uppercase leading-none">Week {currentWeek}</h2>
                        <div className="flex items-center justify-center gap-1.5 text-[8px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mt-1"><Calendar className="w-3 h-3" /> Season</div>
                    </div>
                    <button onClick={() => setCurrentWeek(prev => Math.min(14, prev + 1))} disabled={currentWeek === 14} className="p-2 rounded-full bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-white/10 disabled:opacity-30"><ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" /></button>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20"><Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin text-orange-600 mb-4" /><span className="text-gray-500 font-bold text-xs uppercase tracking-widest">Loading...</span></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
                        {matchups.reduce((acc: any, team: any) => {
                            const id = team.matchup_id;
                            if (!acc[id]) acc[id] = [];
                            acc[id].push(team);
                            return acc;
                        }, []).filter((p:any) => p).map((pair: any, idx: number) => {
                            if (!pair || pair.length < 2) return null;
                            const [tA, tB] = pair;
                            const mA = rosterMap[tA.roster_id] || {};
                            const mB = rosterMap[tB.roster_id] || {};
                            const winA = tA.points > tB.points;
                            const winB = tB.points > tA.points;

                            return (
                                <button key={idx} onClick={() => setSelectedMatchup(pair)} className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-sm border border-gray-200 dark:border-white/10 overflow-hidden hover:scale-[1.02] transition-all text-left w-full group">
                                    <div className="flex items-center justify-between p-4 gap-2">
                                        <div className="flex-1 flex flex-col items-center gap-2">
                                            <div className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 ${winA ? 'border-green-500 shadow-md' : 'border-gray-200 dark:border-white/10 grayscale'}`}>
                                                {mA.avatar ? <Image src={mA.avatar} alt="A" fill className="object-cover rounded-full" unoptimized /> : <div className="w-full h-full bg-gray-200 rounded-full"></div>}
                                            </div>
                                            <div className="text-[10px] sm:text-xs font-bold truncate max-w-[80px] sm:max-w-[100px] text-gray-900 dark:text-white uppercase tracking-tighter leading-none">{mA.teamName}</div>
                                            <div className={`text-lg sm:text-xl font-black ${winA ? 'text-green-600' : 'text-gray-400'}`}>{tA.points.toFixed(1)}</div>
                                        </div>
                                        <div className="text-xl sm:text-2xl font-black text-gray-200 dark:text-white/5 group-hover:text-orange-500/20 transition-colors">VS</div>
                                        <div className="flex-1 flex flex-col items-center gap-2">
                                            <div className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 ${winB ? 'border-green-500 shadow-md' : 'border-gray-200 dark:border-white/10 grayscale'}`}>
                                                {mB.avatar ? <Image src={mB.avatar} alt="B" fill className="object-cover rounded-full" unoptimized /> : <div className="w-full h-full bg-gray-200 rounded-full"></div>}
                                            </div>
                                            <div className="text-[10px] sm:text-xs font-bold truncate max-w-[80px] sm:max-w-[100px] text-gray-900 dark:text-white uppercase tracking-tighter leading-none">{mB.teamName}</div>
                                            <div className={`text-lg sm:text-xl font-black ${winB ? 'text-green-600' : 'text-gray-400'}`}>{tB.points.toFixed(1)}</div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-white/5 py-1.5 text-center text-[8px] sm:text-[9px] text-gray-400 uppercase font-black tracking-[0.2em] group-hover:text-orange-500 transition-colors">View Box Score</div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        )}

        {/* === TAB 2: PLAYOFFS: Scrollable Bracket Wrapper === */}
        {activeTab === 'playoffs' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                {loadingBracket ? (
                    <div className="text-center py-20"><Loader2 className="w-10 h-10 animate-spin mx-auto text-orange-600" /></div>
                ) : (
                    <div className="space-y-12">
                        {/* Winners Bracket */}
                        <div>
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-white/10">
                                <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500" /><h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Winners Bracket</h2>
                            </div>
                            <div className="overflow-x-auto pb-4 no-scrollbar">
                                <div className="flex gap-4 min-w-[700px] sm:min-w-0 md:grid md:grid-cols-3">
                                    {Object.keys(winnersRounds).map((r) => (
                                        <div key={r} className="w-64 sm:w-auto flex-shrink-0 space-y-4">
                                            <h3 className="text-[10px] font-black text-center text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-white/5 py-1 rounded-lg">Round {r}</h3>
                                            {winnersRounds[parseInt(r)].map(m => renderBracketMatch(m, `R${r}`))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        {/* Toilet Bowl */}
                        <div>
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-white/10">
                                <div className="text-xl sm:text-2xl">💩</div><h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Toilet Bowl</h2>
                            </div>
                            <div className="overflow-x-auto pb-4 no-scrollbar">
                                <div className="flex gap-4 min-w-[700px] sm:min-w-0 md:grid md:grid-cols-3">
                                    {Object.keys(losersRounds).map((r) => (
                                        <div key={r} className="w-64 sm:w-auto flex-shrink-0 space-y-4">
                                            <h3 className="text-[10px] font-black text-center text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-white/5 py-1 rounded-lg">Round {r}</h3>
                                            {losersRounds[parseInt(r)].map(m => renderBracketMatch(m, `R${r}`))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}

      </main>

      {/* === BOX SCORE MODAL: Stacked for Mobile Viewports === */}
      {selectedMatchup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedMatchup(null)}>
            <div className="bg-white dark:bg-[#1e1e1e] w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-white/10 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white">
                    <h3 className="font-black text-xs sm:text-base uppercase tracking-widest flex items-center gap-2"><Swords className="w-4 h-4 text-orange-600" /> Matchup Details</h3>
                    <button onClick={() => setSelectedMatchup(null)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
                </div>
                <div className="overflow-y-auto p-3 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-white/5 text-gray-900 dark:text-white">
                    {selectedMatchup.map((team: any, i: number) => {
                        const meta = rosterMap[team.roster_id] || {};
                        const starters = team.starters || [];
                        const points = team.players_points || {};
                        return (
                            <div key={i} className={`flex flex-col gap-4 ${i === 1 ? 'pt-6 md:pt-0 md:pl-8' : ''}`}>
                                <div className="text-center pb-4 border-b border-gray-100 dark:border-white/5">
                                    <div className="relative w-14 h-14 sm:w-20 sm:h-20 mx-auto mb-2 rounded-full border-2 border-orange-500 overflow-hidden shadow-lg">
                                        {meta.avatar ? <Image src={meta.avatar} alt="T" fill className="object-cover" unoptimized /> : <div className="w-full h-full bg-gray-300"></div>}
                                    </div>
                                    <div className="font-black text-sm sm:text-xl uppercase tracking-tighter leading-tight">{meta.teamName}</div>
                                    <div className="text-2xl sm:text-4xl font-black text-green-600 mt-1">{team.points?.toFixed(1) || "0.0"}</div>
                                </div>
                                <div className="space-y-2">
                                    {starters.length > 0 ? starters.map((playerId: string) => {
                                        const player = nflPlayers[playerId] || { first_name: "TBD", last_name: "Player", position: "FLX" };
                                        const score = points[playerId] || 0;
                                        return (
                                            <div key={playerId} className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-transparent hover:border-orange-500/30 transition-all">
                                                <div className="flex items-center gap-2 sm:gap-3">
                                                    <div className="w-8 h-8 sm:w-10 sm:h-10 relative rounded-lg overflow-hidden border border-gray-200 dark:border-white/10 bg-white">
                                                        <img src={`https://sleepercdn.com/content/nfl/players/${playerId}.jpg`} alt="P" className="w-full h-full object-cover" onError={(e:any) => e.target.src = "https://sleepercdn.com/images/v2/icons/player_default.webp"} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <div className="text-[10px] sm:text-xs font-black leading-none uppercase tracking-tighter">{player.first_name[0]}. {player.last_name}</div>
                                                        <div className="text-[8px] sm:text-[9px] font-bold text-gray-400 uppercase mt-0.5">{player.position} • {player.team || "FA"}</div>
                                                    </div>
                                                </div>
                                                <div className="font-mono font-black text-[10px] sm:text-sm text-gray-700 dark:text-gray-300">{score.toFixed(1)}</div>
                                            </div>
                                        );
                                    }) : <div className="text-center text-[10px] text-gray-400 py-6 uppercase font-bold tracking-widest italic">Lineup not yet finalized</div>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
      )}

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}