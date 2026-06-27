'use client';

import React, { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { LCC_LEAGUE_HISTORY } from '@/lib/leagueConstants';
import { DEFAULT_OWNER_IMAGE, getOwnerImagePath } from '@/lib/ownerImages';

const LEAGUE_HISTORY = LCC_LEAGUE_HISTORY;

const MANAGER_MAP: Record<string, { name: string; ownerId: string }> = {
  "467786127214899200": { name: "Rob Jenkins", ownerId: "rob-jenkins" },
  "342828350391230464": { name: "Ray Long", ownerId: "ray-long" },
  "466780021365665792": { name: "Bill Gross", ownerId: "bill-gross" },
  "466659300316540928": { name: "Mike McBurnie", ownerId: "mike-mcburnie" },
  "817056809218080768": { name: "Mike Estes", ownerId: "mike-estes" },
  "466645286870052864": { name: "Earl Perkins", ownerId: "earl-perkins" },
  "466645950710935552": { name: "Loren Michaels", ownerId: "loren-michaels" },
  "356621920969555968": { name: "Jeffrey Hudgins", ownerId: "jeffrey-hudgins" },
  "346727603970973696": { name: "Ben Isbell", ownerId: "ben-isbell" },
  "466638004102885376": { name: "Keith Winder", ownerId: "keith-winder" },
  "466797853767888896": { name: "Tyrone Poist", ownerId: "tyrone-poist" },
  "468192726756618240": { name: "Anthony Martinez", ownerId: "anthony-martinez" }
};

interface SleeperRoster {
  roster_id: number;
  owner_id: string;
}

interface SleeperMatchup {
  matchup_id?: number;
  roster_id: number;
  points?: number;
}

interface RivalryGame {
  year: number;
  week: number;
  a: SleeperMatchup;
  b: SleeperMatchup;
  diff: number;
}

interface RivalryStats {
  aWins: number;
  bWins: number;
  aPoints: number;
  bPoints: number;
  totalGames: number;
  blowout?: RivalryGame;
  shave?: RivalryGame;
}

const INITIAL_STATS: RivalryStats = {
  aWins: 0,
  bWins: 0,
  aPoints: 0,
  bPoints: 0,
  totalGames: 0,
};

const GolfClubsVS = () => (
  <div className="relative flex items-center justify-center w-24 h-24">
    <div className="absolute inset-0 border-2 border-[#C5A059]/10 rounded-full" />
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#C5A059" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="transform rotate-45">
        <path d="M18 4l-4 4m4-4l-1.5 1.5M18 4l1.5 1.5M6 20l4-4" />
        <circle cx="12" cy="12" r="2" fill="#C5A059" />
    </svg>
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#C5A059" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="absolute transform -rotate-45">
        <path d="M18 4l-4 4m4-4l-1.5 1.5M18 4l1.5 1.5M6 20l4-4" />
    </svg>
  </div>
);

export default function RivalryHub() {
  const [playerA, setPlayerA] = useState('');
  const [playerB, setPlayerB] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<RivalryGame | null>(null);
  const [stats, setStats] = useState<RivalryStats>(INITIAL_STATS);

  const scanHistory = async (nextPlayerA: string, nextPlayerB: string) => {
    if (!nextPlayerA || !nextPlayerB) return;
    setLoading(true);
    const h2h = { aWins: 0, bWins: 0, aPoints: 0, bPoints: 0, totalGames: 0 };
    const games: RivalryGame[] = [];

    for (const season of LEAGUE_HISTORY) {
      try {
        const rosterRes = await fetch(`https://api.sleeper.app/v1/league/${season.id}/rosters`);
        const rosters = await rosterRes.json() as SleeperRoster[];
        const ridA = rosters.find((r) => r.owner_id === nextPlayerA)?.roster_id;
        const ridB = rosters.find((r) => r.owner_id === nextPlayerB)?.roster_id;
        if (!ridA || !ridB) continue;

        for (let w = 1; w <= 17; w++) {
          const mRes = await fetch(`https://api.sleeper.app/v1/league/${season.id}/matchups/${w}`);
          const matchups = await mRes.json() as SleeperMatchup[];
          const matchA = matchups.find((m) => m.roster_id === ridA);
          const matchB = matchups.find((m) => m.roster_id === ridB);

          if (matchA?.matchup_id === matchB?.matchup_id && matchA && matchB) {
            const aPoints = matchA.points || 0;
            const bPoints = matchB.points || 0;
            const diff = Math.abs(aPoints - bPoints);
            games.push({ year: season.year, week: w, a: matchA, b: matchB, diff });
            
            h2h.totalGames++;
            h2h.aPoints += aPoints;
            h2h.bPoints += bPoints;
            if (aPoints > bPoints) h2h.aWins++;
            else if (bPoints > aPoints) h2h.bWins++;
          }
        }
      } catch (err) { console.error(err); }
    }

    const blowout = games.reduce((prev, curr) => (prev.diff > curr.diff) ? prev : curr, games[0]);
    const shave = games.reduce((prev, curr) => (prev.diff < curr.diff) ? prev : curr, games[0]);

    setStats({ ...h2h, blowout, shave });
    setLoading(false);
  };

  const handlePlayerAChange = (nextPlayerA: string) => {
    setPlayerA(nextPlayerA);
    void scanHistory(nextPlayerA, playerB);
  };

  const handlePlayerBChange = (nextPlayerB: string) => {
    setPlayerB(nextPlayerB);
    void scanHistory(playerA, nextPlayerB);
  };

  const managerA = MANAGER_MAP[playerA];
  const managerB = MANAGER_MAP[playerB];
  const aWinPct = stats.totalGames > 0 ? (stats.aWins / stats.totalGames) * 100 : 50;

  return (
    <div className="min-h-screen bg-[#F9F7F2] font-serif text-[#1A472A] p-8 pb-32">
      <div className="flex justify-center items-center gap-12 mb-16">
        <ManagerProfile id={playerA} manager={managerA} setPlayer={handlePlayerAChange} hasLead={stats.aWins > stats.bWins} />
        <GolfClubsVS />
        <ManagerProfile id={playerB} manager={managerB} setPlayer={handlePlayerBChange} hasLead={stats.bWins > stats.aWins} />
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-20 opacity-20"><Loader2 className="animate-spin mb-4" size={48} /><p className="font-black uppercase text-[10px]">Scanning History...</p></div>
      ) : stats.totalGames > 0 && (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
          
          <div className="bg-white rounded-[3rem] p-12 shadow-xl border border-black/5">
            <div className="h-10 w-full bg-[#F9F7F2] rounded-full overflow-hidden flex border border-black/5 mb-12 shadow-inner">
              <div className="h-full bg-[#1A472A] transition-all duration-1000 flex items-center justify-center text-white text-[10px] font-black" style={{ width: `${aWinPct}%` }}>{Math.round(aWinPct)}%</div>
              <div className="h-full bg-[#C5A059] transition-all duration-1000 flex items-center justify-center text-black text-[10px] font-black" style={{ width: `${100 - aWinPct}%` }}>{Math.round(100 - aWinPct)}%</div>
            </div>
            
            <div className="grid grid-cols-2 gap-12 text-center">
              <div>
                <p className="text-[10px] font-black uppercase opacity-40 mb-2">Wins</p>
                <h4 className="text-6xl font-black italic">{stats.aWins}</h4>
                <p className="text-xs font-bold mt-4 opacity-60">Avg: {(stats.aPoints / (stats.totalGames || 1)).toFixed(1)} PPG</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase opacity-40 mb-2">Wins</p>
                <h4 className="text-6xl font-black italic">{stats.bWins}</h4>
                <p className="text-xs font-bold mt-4 opacity-60">Avg: {(stats.bPoints / (stats.totalGames || 1)).toFixed(1)} PPG</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
             <button onClick={() => setSelectedMatch(stats.blowout || null)} className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm text-center hover:scale-[1.02] transition-transform">
                <p className="text-[10px] font-black uppercase opacity-40 mb-2">Biggest Blowout</p>
                <p className="text-2xl font-black italic">± {stats.blowout?.diff.toFixed(1)} Pts</p>
                <span className="text-[8px] font-black uppercase opacity-30 mt-4 block tracking-widest">Click to View Archive</span>
             </button>
             <button onClick={() => setSelectedMatch(stats.shave || null)} className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm text-center hover:scale-[1.02] transition-transform">
                <p className="text-[10px] font-black uppercase opacity-40 mb-2">Closest Shave</p>
                <p className="text-2xl font-black italic">± {stats.shave?.diff.toFixed(1)} Pts</p>
                <span className="text-[8px] font-black uppercase opacity-30 mt-4 block tracking-widest">Click to View Archive</span>
             </button>
          </div>

          <div className="bg-white p-10 rounded-[2.5rem] border border-black/5 shadow-md flex justify-around items-center">
             <div><p className="text-[10px] font-black uppercase opacity-40 mb-1">Total Points</p><p className="text-3xl font-black italic">{stats.aPoints.toLocaleString()}</p></div>
             <div className="w-px h-12 bg-black/5" />
             <div><p className="text-[10px] font-black uppercase opacity-40 mb-1">Total Points</p><p className="text-3xl font-black italic">{stats.bPoints.toLocaleString()}</p></div>
          </div>
        </div>
      )}

      {selectedMatch && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setSelectedMatch(null)}>
          <div className="bg-white rounded-[3rem] w-full max-w-lg p-12 relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedMatch(null)} className="absolute top-8 right-8"><X /></button>
            <h2 className="text-2xl font-black italic uppercase mb-8 border-b pb-4 text-center">{selectedMatch.year} Week {selectedMatch.week}</h2>
            <div className="space-y-6">
                <div className="flex justify-between items-center text-xl font-black">
                    <span className={(selectedMatch.a.points || 0) > (selectedMatch.b.points || 0) ? 'text-[#1A472A]' : 'opacity-30'}>{managerA?.name}</span>
                    <span>{(selectedMatch.a.points || 0).toFixed(1)}</span>
                </div>
                <div className="flex justify-between items-center text-xl font-black">
                    <span className={(selectedMatch.b.points || 0) > (selectedMatch.a.points || 0) ? 'text-[#C5A059]' : 'opacity-30'}>{managerB?.name}</span>
                    <span>{(selectedMatch.b.points || 0).toFixed(1)}</span>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ManagerProfile({
  manager,
  id,
  setPlayer,
  hasLead,
}: {
  manager?: { name: string; ownerId: string };
  id: string;
  setPlayer: (value: string) => void;
  hasLead: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="w-28 h-28 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-white">
        <img src={manager ? getOwnerImagePath(manager.ownerId) : DEFAULT_OWNER_IMAGE} className="w-full h-full object-cover" alt={manager?.name || 'Manager'} />
      </div>
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
            <h3 className="text-xl font-black italic uppercase leading-none">{manager?.name || "???"}</h3>
            {hasLead && <span className="text-2xl">💪</span>}
        </div>
        <select value={id} onChange={(e) => setPlayer(e.target.value)} className="bg-white border-2 border-black/5 p-4 rounded-xl font-black uppercase italic text-[10px] outline-none cursor-pointer">
          <option value="">Select Rival</option>
          {Object.entries(MANAGER_MAP).map(([uid, info]) => <option key={uid} value={uid}>{info.name}</option>)}
        </select>
      </div>
    </div>
  );
}
