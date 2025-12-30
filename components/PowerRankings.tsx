'use client';

import { BrainCircuit } from 'lucide-react';

// UPDATED: 12 Teams total. 
// You can edit the "name" and "winProb" for the bottom teams if needed.
const PREDICTIONS = [
  { rank: 1, name: "MadPanda", winProb: 23.4, status: 'active' },
  { rank: 2, name: "adogg6jmu", winProb: 20.7, status: 'active' },
  { rank: 3, name: "Rashad8176", winProb: 17.8, status: 'active' },
  { rank: 4, name: "millatime27", winProb: 15.2, status: 'active' },
  { rank: 5, name: "jordanmaslyn", winProb: 12.5, status: 'active' },
  { rank: 6, name: "drschoppejr", winProb: 10.4, status: 'active' },
  { rank: 7, name: "Nudas Priest", winProb: 0.0, status: 'eliminated' },
  { rank: 8, name: "ETN' Deez Nutz", winProb: 0.0, status: 'eliminated' },
  { rank: 9, name: "Carolina Reapers", winProb: 0.0, status: 'eliminated' },
  { rank: 10, name: "Trash Pandas", winProb: 0.0, status: 'eliminated' },
  { rank: 11, name: "DBeard", winProb: 0.0, status: 'eliminated' },
  { rank: 12, name: "Team 12", winProb: 0.0, status: 'eliminated' },
];

export default function PowerRankings() {
  return (
    <div className="rounded-2xl border border-purple-900/30 bg-[#0f0a1e] p-6 shadow-xl relative overflow-hidden">
      
      {/* Header */}
      <div className="flex justify-between items-end mb-6 relative z-10">
        <div className="flex items-center gap-3">
             <BrainCircuit className="w-6 h-6 text-purple-500" />
             <h2 className="text-xl font-bold text-white">AI Championship Predictor</h2>
        </div>
        <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest opacity-80 animate-pulse">
            Live Win %
        </span>
      </div>

      {/* List */}
      <div className="space-y-4 relative z-10">
        {PREDICTIONS.map((team) => (
          <div key={team.rank} className="relative group">
            
            {/* Row Layout */}
            <div className={`flex items-center gap-4 ${team.status === 'eliminated' ? 'opacity-40 grayscale' : ''}`}>
                
                {/* Rank Badge */}
                <div className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold shrink-0
                    ${team.rank === 1 ? 'bg-yellow-500 text-black shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'bg-white/10 text-white'}`}>
                    {team.rank}
                </div>

                {/* Name & Bar Container */}
                <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-bold text-gray-200">{team.name}</span>
                        {team.status === 'eliminated' ? (
                            <span className="text-[10px] bg-red-900/50 text-red-400 px-1.5 py-0.5 rounded border border-red-900">ELIMINATED</span>
                        ) : (
                            <span className="text-xs font-mono font-bold text-purple-300">{team.winProb}%</span>
                        )}
                    </div>
                    
                    {/* Progress Bar Track */}
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        {/* Progress Bar Fill */}
                        <div 
                            className={`h-full rounded-full transition-all duration-1000 ease-out relative
                                ${team.rank === 1 ? 'bg-gradient-to-r from-purple-600 to-blue-500' : 'bg-gradient-to-r from-purple-600/80 to-purple-800'}`}
                            style={{ width: `${team.winProb}%` }}
                        >
                            {/* Shimmer Effect for #1 */}
                            {team.rank === 1 && (
                                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
          </div>
        ))}
      </div>

    </div>
  );
}