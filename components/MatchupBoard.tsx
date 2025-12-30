"use client";

import React, { useEffect, useState } from "react";
import { getLeagueInfo, getLeagueManagers, getRosters, getMatchupsForWeek, getPlayoffBrackets, Matchup, BracketMatch } from "@/lib/sleeper";
import { Calendar, Trophy, ChevronRight, AlertTriangle } from "lucide-react";

export default function MatchupBoard() {
  const [activeTab, setActiveTab] = useState<"regular" | "playoffs">("regular");
  const [bracketType, setBracketType] = useState<"winners" | "losers">("winners");
  
  const [loading, setLoading] = useState(true);
  const [leagueData, setLeagueData] = useState<any>(null);
  const [matchups, setMatchups] = useState<Matchup[]>([]);
  const [managers, setManagers] = useState<any>({});
  const [rosters, setRosters] = useState<any>({});
  const [brackets, setBrackets] = useState<{ winners: BracketMatch[], losers: BracketMatch[] }>({ winners: [], losers: [] });
  const [currentWeek, setCurrentWeek] = useState(1);

  useEffect(() => {
    async function init() {
      try {
        const info = await getLeagueInfo();
        setLeagueData(info);
        const week = info.settings.leg; 
        setCurrentWeek(week);

        const [mgrs, rstrs] = await Promise.all([
          getLeagueManagers(),
          getRosters()
        ]);
        setManagers(mgrs);
        
        const rosterMap: any = {};
        rstrs.forEach((r: any) => {
          rosterMap[r.roster_id] = {
             owner_id: r.owner_id,
             wins: r.settings.wins,
             losses: r.settings.losses,
             fpts: r.settings.fpts
          };
        });
        setRosters(rosterMap);

        // Check if playoffs have started
        const playoffStart = info.settings.playoff_week_start;
        // If current week is >= playoff start, default to playoffs tab
        if (playoffStart && week >= playoffStart) {
            setActiveTab("playoffs");
            const bracketData = await getPlayoffBrackets();
            setBrackets(bracketData);
        } else {
            const matchData = await getMatchupsForWeek(week);
            setMatchups(matchData);
        }

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading Arena...</div>;

  const activeBracket = bracketType === "winners" ? brackets.winners : brackets.losers;

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl mt-8">
      
      {/* HEADER TABS */}
      <div className="flex border-b border-slate-800 bg-slate-950">
        <button
          onClick={() => setActiveTab("regular")}
          className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition ${
            activeTab === "regular" ? "bg-blue-600 text-white" : "text-gray-500 hover:text-white hover:bg-slate-900"
          }`}
        >
          Regular Season
        </button>
        <button
          onClick={() => setActiveTab("playoffs")}
          className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition ${
            activeTab === "playoffs" ? "bg-orange-600 text-white" : "text-gray-500 hover:text-white hover:bg-slate-900"
          }`}
        >
          Playoffs
        </button>
      </div>

      {/* CONTENT AREA */}
      <div className="p-6">
        
        {/* --- REGULAR SEASON VIEW --- */}
        {activeTab === "regular" && (
          <div>
            <div className="flex items-center gap-2 mb-6 text-xl font-bold text-white">
               <Calendar className="text-blue-500" />
               <span>Week {currentWeek} Matchups</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {processMatchups(matchups).map((match, i) => (
                <div key={i} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 relative overflow-hidden group hover:border-blue-500/30 transition">
                  <TeamRow rosterId={match.team1.roster_id} score={match.team1.points} managers={managers} rosters={rosters} isWinner={match.team1.points > match.team2.points} />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 group-hover:opacity-10 transition">
                    <span className="text-6xl font-black italic text-slate-700">VS</span>
                  </div>
                  <TeamRow rosterId={match.team2.roster_id} score={match.team2.points} managers={managers} rosters={rosters} isWinner={match.team2.points > match.team1.points} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- PLAYOFF VIEW --- */}
        {activeTab === "playoffs" && (
           <div>
             <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-xl font-bold text-white">
                    <Trophy className="text-orange-500" />
                    <span>Playoffs</span>
                </div>
                
                {/* SUB TABS FOR BRACKET TYPE */}
                <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
                    <button 
                        onClick={() => setBracketType("winners")}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition ${
                            bracketType === "winners" ? "bg-blue-600 text-white shadow" : "text-gray-500 hover:text-gray-300"
                        }`}
                    >
                        Champions
                    </button>
                    <button 
                         onClick={() => setBracketType("losers")}
                         className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition ${
                            bracketType === "losers" ? "bg-slate-700 text-white shadow" : "text-gray-500 hover:text-gray-300"
                        }`}
                    >
                        Toilet Bowl
                    </button>
                </div>
             </div>

            {/* BRACKET VISUALIZATION */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Group matches by Round (r) */}
                {[1, 2, 3].map(round => {
                    // Filter matches for this round
                    const roundMatches = activeBracket.filter(m => m.r === round);
                    const roundName = round === 1 ? "Quarterfinals" : round === 2 ? "Semifinals" : "Championship";
                    
                    if (roundMatches.length === 0) return null;

                    return (
                        <div key={round} className="space-y-4">
                            <h3 className="text-center text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">{roundName}</h3>
                            {roundMatches.map((game, i) => (
                                <div key={i} className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex flex-col gap-2 relative">
                                    {/* Connector Line (Visual Only) */}
                                    {round < 3 && <div className="hidden md:block absolute -right-4 top-1/2 w-4 h-0.5 bg-slate-800"></div>}
                                    
                                    <BracketTeam rosterId={game.t1} managers={managers} rosters={rosters} winner={game.w === game.t1} />
                                    <BracketTeam rosterId={game.t2} managers={managers} rosters={rosters} winner={game.w === game.t2} />
                                </div>
                            ))}
                        </div>
                    )
                })}
            </div>
            
            {activeBracket.length === 0 && (
                <div className="text-center p-10 text-gray-500 italic">
                    Playoff bracket not generated yet.
                </div>
            )}
           </div>
        )}

      </div>
    </div>
  );
}

// --- HELPER COMPONENTS ---

function TeamRow({ rosterId, score, managers, rosters, isWinner }: any) {
    const ownerId = rosters[rosterId]?.owner_id;
    const manager = managers[ownerId];
    return (
        <div className={`flex items-center justify-between z-10 ${isWinner ? "opacity-100" : "opacity-70"}`}>
            <div className="flex items-center gap-3">
                <img 
                    src={manager?.avatar || "https://sleepercdn.com/images/v2/icons/player_default.webp"} 
                    alt="avatar" 
                    className="w-10 h-10 rounded-full border border-slate-700 bg-slate-900"
                />
                <div>
                    <div className="font-bold text-sm text-white truncate max-w-[120px] sm:max-w-[200px]">
                        {manager?.name || `Team ${rosterId}`}
                    </div>
                    <div className="text-xs text-gray-500">
                        {rosters[rosterId]?.wins}-{rosters[rosterId]?.losses}
                    </div>
                </div>
            </div>
            <div className={`text-xl font-mono font-bold ${isWinner ? "text-green-400" : "text-gray-500"}`}>
                {score.toFixed(2)}
            </div>
        </div>
    );
}

function BracketTeam({ rosterId, managers, rosters, winner }: any) {
    const ownerId = rosters[rosterId]?.owner_id;
    const manager = managers[ownerId];
    
    // Check if it's a "Bye" or empty slot
    if (!rosterId) {
        return (
            <div className="p-2 rounded bg-slate-900 border border-slate-800/50 flex items-center gap-2 opacity-50">
                <div className="w-6 h-6 rounded-full bg-slate-800"></div>
                <span className="text-xs text-gray-600 italic">TBD / Bye</span>
            </div>
        );
    }

    return (
        <div className={`flex items-center justify-between p-2 rounded border transition ${
            winner 
            ? "bg-green-900/10 border-green-500/30" 
            : "bg-slate-900 border-slate-800"
        }`}>
             <div className="flex items-center gap-2">
                <img 
                    src={manager?.avatar || "https://sleepercdn.com/images/v2/icons/player_default.webp"} 
                    className="w-6 h-6 rounded-full" 
                />
                <span className={`text-xs font-bold ${winner ? "text-white" : "text-gray-400"}`}>
                    {manager?.name || `Team ${rosterId}`}
                </span>
             </div>
             {winner && <Trophy size={12} className="text-yellow-500" />}
        </div>
    )
}

function processMatchups(flatMatchups: Matchup[]) {
    const pairs: any[] = [];
    const map = new Map();
    flatMatchups.forEach(m => {
        if (map.has(m.matchup_id)) {
            pairs.push({ team1: map.get(m.matchup_id), team2: m });
        } else {
            map.set(m.matchup_id, m);
        }
    });
    return pairs;
}