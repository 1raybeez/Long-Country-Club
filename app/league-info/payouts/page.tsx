'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ArrowLeft, DollarSign, Wallet, Trophy, ShieldCheck, 
  AlertCircle, Lock, Unlock, CreditCard, Medal, Zap, Diamond, Loader2, Landmark, Award
} from 'lucide-react';
import { ModeToggle } from '@/components/ModeToggle';

// --- CONFIGURATION ---
const COMMISH_ID = "342828350391230464";
const TOTAL_POT = 600; 

export default function PayoutsPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [managerData, setManagerData] = useState<any[]>([]);
  const [paidStatus, setPaidStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchFinances() {
      setLoading(true);
      try {
        const year = 2025;
        const leagueRes = await fetch(`https://api.sleeper.app/v1/user/${COMMISH_ID}/leagues/nfl/${year}`);
        const leagues = await leagueRes.json();
        const myLeague = leagues.find((l: any) => l.name.includes("River City"));
        
        const [rostersRes, usersRes] = await Promise.all([
          fetch(`https://api.sleeper.app/v1/league/${myLeague.league_id}/rosters`),
          fetch(`https://api.sleeper.app/v1/league/${myLeague.league_id}/users`)
        ]);
        const rosters = await rostersRes.json();
        const users = await usersRes.json();

        // Weekly High Scores Logic
        const weeklyWinnerCounts: Record<number, number> = {};
        const matchupPromises = Array.from({ length: 14 }, (_, i) => 
          fetch(`https://api.sleeper.app/v1/league/${myLeague.league_id}/matchups/${i + 1}`).then(res => res.json())
        );
        const allMatchups = await Promise.all(matchupPromises);

        allMatchups.forEach(weekMatchups => {
          if (!weekMatchups || weekMatchups.length === 0) return;
          const highScorer = weekMatchups.reduce((prev: any, curr: any) => (prev.points > curr.points) ? prev : curr);
          if (highScorer.points > 0) {
            weeklyWinnerCounts[highScorer.roster_id] = (weeklyWinnerCounts[highScorer.roster_id] || 0) + 1;
          }
        });

        // Division Winners Logic
        const divisions: Record<number, any[]> = {};
        rosters.forEach((r: any) => {
          if (!divisions[r.settings.division]) divisions[r.settings.division] = [];
          divisions[r.settings.division].push(r);
        });
        const divWinners = Object.values(divisions).map(teams => 
          teams.sort((a, b) => b.settings.wins - a.settings.wins || b.settings.fpts - a.settings.fpts)[0].roster_id
        );

        const initialPaid: Record<string, boolean> = {};
        const mapped = rosters.map((r: any) => {
          const user = users.find((u: any) => u.user_id === r.owner_id);
          const teamName = user?.metadata?.team_name || user?.display_name || "";
          const ownerName = user?.display_name || "";
          
          let manualRank = 0;
          if (teamName.includes("Nudas") || ownerName.includes("Aaron")) manualRank = 1;
          else if (teamName.includes("Pandas") || ownerName.includes("Travis")) manualRank = 2;
          else if (teamName.includes("Panda") || ownerName.includes("JD")) manualRank = 3;

          const statusKey = r.roster_id.toString();
          initialPaid[statusKey] = true; 

          return {
            name: teamName,
            statusKey,
            avatar: user?.avatar,
            roster_id: r.roster_id,
            isDivWinner: divWinners.includes(r.roster_id),
            weeklyWins: weeklyWinnerCounts[r.roster_id] || 0,
            rank: manualRank,
            dues: 50 
          };
        });

        setManagerData(mapped);
        setPaidStatus(initialPaid);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchFinances();
  }, []);

  const togglePaid = (key: string) => {
    if (!isAdmin) return;
    setPaidStatus(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const calculateWinnings = (m: any) => {
    let total = 0;
    if (m.rank === 1) total += 219;
    if (m.rank === 2) total += 100;
    if (m.rank === 3) total += 50;
    if (m.isDivWinner) total += 25;
    total += (m.weeklyWins * 10);
    return total;
  };

  const totalPaid = managerData.reduce((sum, m) => paidStatus[m.statusKey] === true ? sum + m.dues : sum, 0);
  const totalOwed = Math.max(0, TOTAL_POT - totalPaid);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#121212] p-4 text-center">
      <Loader2 className="w-10 h-10 animate-spin text-green-600 mb-4" />
      <p className="font-bold text-gray-400 uppercase tracking-widest text-sm">Auditing the Ledger...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212] transition-colors duration-300 font-sans pb-20 selection:bg-green-500">
      
      {/* HEADER: RESPONSIVE PADDING & TITLE */}
      <div className="bg-white dark:bg-[#1e1e1e] border-b border-gray-200 dark:border-white/5 pb-6 sm:pb-8 pt-4 sticky top-0 z-50 shadow-sm text-center">
          <div className="container mx-auto px-4 relative flex flex-col items-center">
            <Link href="/league-info" className="sm:absolute sm:top-4 sm:left-4 mb-2 sm:mb-0 flex items-center gap-1 text-gray-500 hover:text-green-600 transition-colors font-bold text-[10px] sm:text-xs uppercase tracking-tight">
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" /> League Info Hub
            </Link>
            <div className="absolute top-4 right-4 z-50 scale-75 sm:scale-100"><ModeToggle /></div>
            <h1 className="mt-2 text-xl sm:text-2xl md:text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center justify-center gap-2 sm:gap-3">
                <Landmark className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" /> Owner's Money
            </h1>
          </div>
      </div>

      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-4xl text-gray-900">
        
        {/* SUMMARY CARDS: GRID FLEXIBILITY */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 mb-8">
            <div className="bg-white dark:bg-[#1e1e1e] p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Dues Collected</p>
                <div className="text-3xl sm:text-4xl font-black text-green-600">${totalPaid}</div>
                <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase">Goal: ${TOTAL_POT}</p>
            </div>
            <div className="bg-white dark:bg-[#1e1e1e] p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Owed</p>
                <div className={`text-3xl sm:text-4xl font-black ${totalOwed > 0 ? 'text-red-500' : 'text-gray-300'}`}>${totalOwed}</div>
                <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase">Pending Collection</p>
            </div>
        </div>

        {/* DISTRIBUTION LEDGER: RESPONSIVE ROWS */}
        <div className="mb-10">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
                <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white flex items-center gap-2 uppercase tracking-tighter">
                    <CreditCard className="w-5 h-5 text-gray-400" /> The Vault
                </h2>
                <button onClick={() => setIsAdmin(!isAdmin)} className={`w-full sm:w-auto px-4 py-1.5 rounded-full text-[10px] font-black border transition-all ${isAdmin ? 'bg-red-500 text-white border-red-400 shadow-md' : 'bg-white dark:bg-[#1e1e1e] text-gray-400 border-gray-200 dark:border-white/5'}`}>
                    {isAdmin ? <Unlock className="w-3 h-3 inline mr-1" /> : <Lock className="w-3 h-3 inline mr-1" />}
                    {isAdmin ? 'Admin Mode On' : 'Admin Mode Off'}
                </button>
            </div>

            <div className="bg-white dark:bg-[#1e1e1e] rounded-[1.5rem] sm:rounded-[2rem] border border-gray-200 dark:border-white/5 shadow-sm overflow-hidden divide-y divide-gray-100 dark:divide-white/5 text-gray-900 dark:text-white">
                {managerData.map((m, index) => {
                    const isPaid = paidStatus[m.statusKey];
                    const winnings = calculateWinnings(m);
                    
                    return (
                        <div key={`${m.roster_id}-${index}`} className="p-4 sm:p-6 flex flex-col md:flex-row items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group gap-4">
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-800 relative overflow-hidden shrink-0 shadow-sm border border-gray-100 dark:border-white/5">
                                    <Image src={`https://sleepercdn.com/avatars/thumbs/${m.avatar}`} alt={m.name} fill className="object-cover" unoptimized />
                                </div>
                                <div className="flex flex-col text-left">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-bold text-sm sm:text-base tracking-tight truncate max-w-[140px] sm:max-w-none">{m.name}</span>
                                        {m.isDivWinner && <span className="text-[8px] font-black bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded uppercase border border-blue-200">Div King</span>}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                        {m.rank === 1 && <span className="text-[8px] font-black bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded uppercase">Champ</span>}
                                        {m.rank === 2 && <span className="text-[8px] font-black bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded uppercase">Silver</span>}
                                        {m.rank === 3 && <span className="text-[8px] font-black bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded uppercase">3rd</span>}
                                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{m.weeklyWins} Highs</span>
                                        {winnings > 0 && <span className="text-[9px] sm:text-[10px] font-black text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20 px-2 py-0.5 rounded-full border border-green-200 dark:border-green-800/40 shadow-sm">WON ${winnings}</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="w-full md:w-auto">
                                <button 
                                    onClick={() => togglePaid(m.statusKey)} 
                                    className={`w-full md:w-auto px-6 py-2 rounded-xl text-[10px] font-black border uppercase transition-all ${
                                        isPaid ? 'bg-green-100 text-green-700 dark:bg-green-900/30 border-green-200 dark:border-green-800' : 'bg-red-50 text-red-600 dark:bg-red-900/30 border-red-100 dark:border-red-800 animate-pulse'
                                    } ${isAdmin ? 'cursor-pointer hover:scale-105 active:scale-95 shadow-sm' : 'cursor-default'}`}
                                >
                                    {isPaid ? 'Paid' : 'Unpaid'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      </main>
    </div>
  );
}