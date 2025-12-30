'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Skull, Trophy, BrainCircuit, Loader2 } from 'lucide-react';
import { ModeToggle } from '@/components/ModeToggle';

const LEAGUE_ID = "1199749375539027968"; 

// --- TYPES ---
interface TeamData {
  rosterId: number;
  name: string;
  avatar: string | null;
  fpts: number;
  ppts: number;
  wins: number;
  losses: number;
  status: 'Alive' | 'Eliminated';
  winProb: number;
}

export default function PredictorPage() {
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPredictionData() {
      try {
        // 1. Fetch Core Data
        const [usersRes, rostersRes, bracketRes] = await Promise.all([
          fetch(`https://api.sleeper.app/v1/league/${LEAGUE_ID}/users`),
          fetch(`https://api.sleeper.app/v1/league/${LEAGUE_ID}/rosters`),
          fetch(`https://api.sleeper.app/v1/league/${LEAGUE_ID}/winners_bracket`)
        ]);

        const users = await usersRes.json();
        const rosters = await rostersRes.json();
        const bracket = await bracketRes.json();

        // 2. Map User Details
        const userMap: Record<string, { name: string; avatar: string }> = {};
        users.forEach((u: any) => {
          userMap[u.user_id] = {
            name: u.metadata?.team_name || u.display_name,
            avatar: u.avatar
          };
        });

        // 3. Identify Eliminated Teams from Bracket
        // A team is eliminated if they have a 'l' (loss) in the bracket, 
        // OR if they aren't in the bracket at all.
        const eliminatedRosterIds = new Set<number>();
        const bracketParticipants = new Set<number>();

        bracket.forEach((match: any) => {
          if (match.t1) bracketParticipants.add(match.t1);
          if (match.t2) bracketParticipants.add(match.t2);
          if (match.l) eliminatedRosterIds.add(match.l);
        });

        // 4. Build Team Objects & Calculate Raw Power Score
        let totalPowerScore = 0;
        const processedTeams: TeamData[] = rosters.map((r: any) => {
          const owner = userMap[r.owner_id] || { name: 'Unknown', avatar: null };
          
          const madePlayoffs = bracketParticipants.has(r.roster_id);
          const isEliminated = !madePlayoffs || eliminatedRosterIds.has(r.roster_id);

          // Power Score Algorithm (60% Points / 20% Ceiling / 20% Record)
          let powerScore = 0;
          if (!isEliminated) {
             const winPct = r.settings.wins / (r.settings.wins + r.settings.losses || 1);
             powerScore = (r.settings.fpts * 0.6) + (r.settings.ppts * 0.2) + (winPct * 500); 
             totalPowerScore += powerScore;
          }

          return {
            rosterId: r.roster_id,
            name: owner.name,
            avatar: owner.avatar,
            fpts: r.settings.fpts,
            ppts: r.settings.ppts,
            wins: r.settings.wins,
            losses: r.settings.losses,
            status: isEliminated ? 'Eliminated' : 'Alive',
            winProb: powerScore
          };
        });

        // 5. Final Probability Normalization
        const finalTeams = processedTeams.map(t => ({
          ...t,
          winProb: t.status === 'Alive' ? (t.winProb / totalPowerScore) * 100 : 0.0
        })).sort((a, b) => b.winProb - a.winProb);

        setTeams(finalTeams);
        setLoading(false);

      } catch (error) {
        console.error("Error fetching predictor data:", error);
        setLoading(false);
      }
    }

    fetchPredictionData();
  }, []);

  return (
    // STANDARD BACKGROUND (Matches Managers/Matchups Pages)
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212] transition-colors duration-300 font-sans selection:bg-purple-500 selection:text-white">
      
      {/* BACK LINK */}
      <div className="container mx-auto px-4 pt-6 flex justify-between items-center">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <ModeToggle />
      </div>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        
        {/* HEADER */}
        <div className="flex items-center gap-4 mb-8">
           <div className="bg-purple-600 p-3 rounded-2xl shadow-lg shadow-purple-500/20">
              <BrainCircuit className="w-8 h-8 text-white" />
           </div>
           <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-1 text-gray-900 dark:text-white">AI Championship Predictor</h1>
              <p className="text-xs md:text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                 Live Odds • Powered by Sleeper Data
              </p>
           </div>
        </div>

        {/* PROJECTIONS CARD */}
        <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-xl">
           
           {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                 <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
                 <p className="text-xs font-mono uppercase text-gray-400 animate-pulse">Crunching Playoff Scenarios...</p>
              </div>
           ) : (
             <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-black/20 text-[10px] md:text-xs uppercase font-bold text-gray-500 dark:text-gray-400">
                   <tr>
                      <th className="px-4 md:px-6 py-4">Rank</th>
                      <th className="px-4 md:px-6 py-4">Team</th>
                      <th className="px-4 md:px-6 py-4 text-center hidden md:table-cell">Win Probability</th>
                      <th className="px-4 md:px-6 py-4 text-center md:hidden">Odds</th>
                      <th className="px-4 md:px-6 py-4 text-right">Status</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                   {teams.map((team, index) => (
                      <tr key={team.rosterId} className={`hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${team.status === 'Eliminated' ? 'bg-gray-50/50 dark:bg-black/10' : ''}`}>
                         
                         {/* Rank */}
                         <td className="px-4 md:px-6 py-4 font-mono text-gray-400 text-sm w-12 md:w-16">
                            #{index + 1}
                         </td>
                         
                         {/* Team Name & Avatar */}
                         <td className="px-4 md:px-6 py-4">
                            <div className="flex items-center gap-3">
                               <div className="relative w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 shrink-0">
                                  {team.avatar ? (
                                     <Image src={`https://sleepercdn.com/avatars/${team.avatar}`} alt={team.name} fill className="object-cover" />
                                  ) : (
                                     <div className="flex items-center justify-center w-full h-full text-xs font-bold text-gray-500">?</div>
                                  )}
                               </div>
                               <span className={`text-sm md:text-lg font-bold truncate max-w-[120px] md:max-w-none ${team.status === 'Eliminated' ? 'text-gray-400 line-through decoration-gray-400/50' : 'text-gray-900 dark:text-white'}`}>
                                  {team.name}
                               </span>
                            </div>
                         </td>
                         
                         {/* Probability Bar */}
                         <td className="px-4 md:px-6 py-4 align-middle">
                            <div className="flex items-center gap-3">
                               <div className="hidden md:block flex-grow h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden w-24 md:w-auto">
                                  <div 
                                    className={`h-full ${team.status === 'Eliminated' ? 'bg-gray-300 dark:bg-gray-700' : 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-[0_0_10px_rgba(168,85,247,0.4)]'}`} 
                                    style={{ width: `${team.winProb}%` }}
                                  ></div>
                               </div>
                               <span className={`font-mono font-bold text-sm md:text-base w-12 text-right ${team.status === 'Eliminated' ? 'text-gray-300' : 'text-purple-600 dark:text-purple-400'}`}>
                                  {team.winProb.toFixed(1)}%
                               </span>
                            </div>
                         </td>
                         
                         {/* Status Badge */}
                         <td className="px-4 md:px-6 py-4 text-right">
                            {team.status === 'Eliminated' ? (
                               <span className="inline-flex items-center gap-1 text-[10px] font-black text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-full uppercase tracking-wider">
                                  <Skull className="w-3 h-3" /> <span className="hidden md:inline">Eliminated</span>
                               </span>
                            ) : (
                               <span className="inline-flex items-center gap-1 text-[10px] font-black text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full uppercase tracking-wider border border-green-200 dark:border-green-800">
                                  <Trophy className="w-3 h-3" /> <span className="hidden md:inline">Contender</span>
                               </span>
                            )}
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
           )}
        </div>

        <div className="mt-6 text-center text-[10px] text-gray-400 uppercase tracking-widest flex items-center justify-center gap-2">
           <BrainCircuit className="w-3 h-3" />
           Based on Bracket Status & Season Performance
        </div>

      </main>
    </div>
  );
}