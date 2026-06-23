'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ACTIVE_LCC_OWNERS,
  RETIRED_LCC_OWNERS,
  type LccOwner,
} from '@/lib/lccOwners';
import { LCC_LEAGUE_HISTORY_IDS } from '@/lib/leagueConstants';

// Official Toned-Down Themes
const TEAM_THEMES: Record<string, { bg: string; border: string }> = {
  atl: { bg: 'bg-[#a71930]', border: 'border-[#000000]' }, 
  chi: { bg: 'bg-[#0B162A]', border: 'border-[#C83803]' },
  dal: { bg: 'bg-[#003594]', border: 'border-[#869397]' },
  det: { bg: 'bg-[#0076B6]', border: 'border-[#B0B7BC]' },
  nyg: { bg: 'bg-[#0B2265]', border: 'border-[#A71930]' },
  phi: { bg: 'bg-[#004C54]', border: 'border-[#A5ACAF]' },
  pit: { bg: 'bg-[#101820]', border: 'border-[#FFB612]' },
  was: { bg: 'bg-[#5a1414]', border: 'border-[#2b0808]' },
  mia: { bg: 'bg-[#008E97]', border: 'border-[#F26722]' },
  car: { bg: 'bg-[#0085CA]', border: 'border-[#101820]' },
  buf: { bg: 'bg-[#00338D]', border: 'border-[#C60C30]' },
};

interface SleeperRoster {
  owner_id?: string;
  settings?: {
    wins?: number;
    losses?: number;
  };
}

export default function ManagersPage() {
  const [activeTab, setActiveTab] = useState<'active' | 'retired'>('active');

  return (
    <div className="min-h-screen p-6 md:p-12 bg-[#F9F7F2]">
      <header className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-black italic uppercase text-[#1A472A] tracking-tighter underline decoration-[#C5A059] underline-offset-8">Clubhouse Directory</h1>
        
        <div className="mt-12 flex justify-center gap-2">
          <button 
            onClick={() => setActiveTab('active')}
            className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'active' ? 'bg-[#1A472A] text-white shadow-lg' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}
          >Active Owners</button>
          <button 
            onClick={() => setActiveTab('retired')}
            className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'retired' ? 'bg-[#1A472A] text-white shadow-lg' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}
          >Retired Legends</button>
        </div>

        <nav className="mt-8 flex justify-center gap-4">
          <Link href="/"><button className="px-5 py-2 rounded-full border border-gray-300 text-[10px] font-black uppercase tracking-widest hover:bg-[#1A472A] hover:text-white transition-all">Home</button></Link>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto">
        {activeTab === 'active' ? (
          <div className="space-y-24">
            <section>
              <h2 className="text-2xl font-black italic uppercase text-[#1A472A] mb-12 border-b-8 border-[#C5A059] inline-block px-2 tracking-widest leading-none">The Founders & OG&apos;s</h2>
              <div className="clubhouse-grid">
                {ACTIVE_LCC_OWNERS.filter(m => m.managerPage.division === "OG").map((m) => <ButtonFlipCard key={m.id} manager={m} />)}
              </div>
            </section>
            <section>
              <h2 className="text-2xl font-black italic uppercase text-[#1A472A] mb-12 border-b-8 border-[#1A472A] inline-block px-2 tracking-widest leading-none">The Newbie Division</h2>
              <div className="clubhouse-grid">
                {ACTIVE_LCC_OWNERS.filter(m => m.managerPage.division === "NEWBIE").map((m) => <ButtonFlipCard key={m.id} manager={m} />)}
              </div>
            </section>
          </div>
        ) : (
          <section>
            <h2 className="text-2xl font-black italic uppercase text-[#1A472A] mb-12 border-b-8 border-gray-400 inline-block px-2 tracking-widest leading-none">Hall of Fame</h2>
            <div className="clubhouse-grid">
              {RETIRED_LCC_OWNERS.map((m) => <ButtonFlipCard key={m.id} manager={m} isRetired={true} />)}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function ButtonFlipCard({ manager, isRetired = false }: { manager: LccOwner; isRetired?: boolean }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [record, setRecord] = useState({ wins: 0, losses: 0, loading: !isRetired });
  const card = manager.managerPage;
  const theme = TEAM_THEMES[card.nflTeam] || { bg: 'bg-[#420d09]', border: 'border-white/10' };
  const titles = card.titles || 0;
  const tradeAggression = card.tradeAggression || 0;
  const totalPodiums = (card.podiums.first?.length || 0) + (card.podiums.second?.length || 0) + (card.podiums.third?.length || 0);

  // FETCH CAREER RECORD
  useEffect(() => {
    if (isRetired || !manager.sleeperUserId) return;
    
    async function fetchStats() {
      let w = 0; let l = 0;
      try {
        for (const leagueId of LCC_LEAGUE_HISTORY_IDS) {
          const res = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/rosters`);
          const rosters = await res.json() as SleeperRoster[];
          const roster = rosters.find((r) => r.owner_id === manager.sleeperUserId);
          if (roster?.settings) {
            w += (roster.settings.wins || 0);
            l += (roster.settings.losses || 0);
          }
        }
        setRecord({ wins: w, losses: l, loading: false });
      } catch { setRecord(prev => ({ ...prev, loading: false })); }
    }
    fetchStats();
  }, [manager.sleeperUserId, isRetired]);

  return (
    <div className={`flip-card ${isRetired ? 'grayscale-[0.4] hover:grayscale-0 transition-all duration-500' : ''}`}>
      <div className={`flip-card-inner ${isFlipped ? 'is-flipped' : ''}`}>
        
        {/* FRONT SIDE */}
        <div className={`flip-card-front flex flex-col p-6 text-white ${theme.bg} border-4 ${theme.border} shadow-2xl relative overflow-hidden`}>
          
          <div className="w-full flex justify-between items-start mb-6">
             <div className="flex flex-col gap-1">
                {manager.commissioner && <span className="bg-[#C5A059] text-black text-[7px] font-black px-2 py-0.5 rounded uppercase tracking-widest w-fit border border-white/20 shadow-md">👑 COMMISH</span>}
                <span className={`${manager.inMemoriam ? 'bg-white text-black' : 'bg-black/40 text-white'} text-[7px] font-black px-2 py-0.5 rounded uppercase tracking-widest w-fit border border-white/10`}>
                   {manager.inMemoriam ? '🕊️ IN MEMORIAM' : card.badgeLabel}
                </span>
             </div>
             <button onClick={() => setIsFlipped(true)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all cursor-pointer">🔄</button>
          </div>

          <h2 className="text-2xl font-black uppercase tracking-tighter leading-tight mb-1">{card.sleeperName}</h2>
          <p className="text-[10px] font-bold text-white/60 mb-6">{manager.nickname} • EST {manager.joinedYear}</p>

          <div className="flex items-center gap-6 mb-6">
             <div className="relative shrink-0">
                <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden shadow-2xl bg-white/5">
                   <img src={`/managers/${manager.avatarFilename}`} className="w-full h-full object-cover" onError={(e)=>e.currentTarget.src="/logos/Sleeper.png"} alt={manager.nickname} />
                </div>
                {titles > 0 && (
                   <div className="absolute -top-1 -right-1 bg-[#C5A059] text-black w-10 h-10 rounded-full flex flex-col items-center justify-center border-4 border-white shadow-xl z-20">
                      <span className="text-[14px] leading-none mb-0.5">🏆</span>
                      <span className="text-[10px] font-black leading-none uppercase">x{titles}</span>
                   </div>
                )}
             </div>

             {/* DATA AREA: STATS AND ICONS */}
             <div className="flex flex-col gap-2">
                {!isRetired && (
                  <div className="bg-black/40 px-3 py-2 rounded-xl border border-white/10">
                    <p className="text-[7px] font-black uppercase tracking-widest text-[#C5A059] mb-1 leading-none">Career Record</p>
                    {record.loading ? (
                      <Loader2 size={12} className="animate-spin opacity-40" />
                    ) : (
                      <p className="text-lg font-black italic tracking-tighter leading-none">{record.wins}-{record.losses}</p>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-3 mt-1">
                  {!isRetired && (
                    <a href={`sms:${card.phone}`}><img src="/logos/iMessage.png" className="w-9 h-9 hover:scale-110 transition-transform shadow-lg" alt="iMessage" /></a>
                  )}
                  <img src="/logos/Sleeper.png" className="w-6 h-6 opacity-40" alt="Sleeper" />
                </div>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-6">
            <StatBox label="Favorite Team" val={card.nflTeam.toUpperCase()} color="bg-black/30" />
            <StatBox label="Status" val={isRetired ? "Legend" : card.badgeLabel} color="bg-black/30" />
          </div>

          {!isRetired && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[8px] uppercase font-black tracking-widest text-white/50 italic leading-none">Trade Aggression</span>
	                <span className="text-[9px] font-black text-[#C5A059]">{tradeAggression}/10</span>
              </div>
              <div className="h-2 w-full bg-black/30 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-gradient-to-r from-red-600 via-yellow-400 to-green-500 rounded-full" 
	                  style={{ width: `${tradeAggression * 10}%` }} 
                />
              </div>
            </div>
          )}

          <div className="mt-auto pt-4 border-t border-white/10 flex justify-between items-end">
             <div className="flex flex-col">
                <div className="flex items-center gap-1 mb-1 text-[8px] uppercase font-black text-white/40 tracking-widest italic leading-none">
                   <span>{isRetired ? '📜' : '⚔️'}</span> {isRetired ? 'Legacy' : 'Rivalry'}
                </div>
                <div className="flex items-center gap-2">
                   {card.rivalNickname ? (
                     <>
                        <div className="w-8 h-8 rounded-full border-2 border-white/20 overflow-hidden bg-white/5">
                           <img src={`/managers/${card.rivalAvatarFilename}`} className="w-full h-full object-cover" onError={(e)=>e.currentTarget.src="/logos/Sleeper.png"} alt="Rival" />
                        </div>
                        <span className="text-[11px] font-black uppercase italic tracking-tighter leading-none">{card.rivalNickname}</span>
                     </>
                   ) : (
                     <span className="text-[11px] font-black uppercase italic tracking-tighter text-white/30 whitespace-nowrap overflow-hidden leading-none">Retired Legend</span>
                   )}
                </div>
             </div>
             <div className="opacity-20 font-black text-3xl italic tracking-tighter select-none leading-none">LCC</div>
          </div>
        </div>

        {/* BACK SIDE */}
        <div className={`flip-card-back flex flex-col p-8 text-white bg-[#111] border-4 border-[#C5A059] shadow-2xl`}>
          <div className="w-full flex justify-between items-center mb-8 border-b border-white/10 pb-4">
            <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-[#C5A059]">🏆 {isRetired ? 'Career History' : 'History & Legacy'}</h4>
            <button onClick={() => setIsFlipped(false)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all cursor-pointer">❌</button>
          </div>
          <div className="space-y-6 flex-grow overflow-y-auto pr-2 custom-scrollbar">
            <PodiumRow label="League Champion" years={card.podiums.first || []} icon="🥇" color="text-yellow-400" />
            <PodiumRow label="Runner Up" years={card.podiums.second || []} icon="🥈" color="text-gray-400" />
            <PodiumRow label="Third Place" years={card.podiums.third || []} icon="🥉" color="text-amber-700" />
          </div>
          <div className="mt-auto pt-6 border-t border-white/10 flex justify-between items-center">
             <div className="text-center bg-white/5 px-4 py-2 rounded-xl">
               <p className="text-[10px] text-[#C5A059] uppercase font-black tracking-widest leading-none">Total Podiums</p>
               <p className="text-3xl font-black leading-none mt-1">{totalPodiums}</p>
             </div>
             <div className="text-white/10 font-black text-5xl italic leading-none">LCC</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// LOADER COMPONENT FOR DATA FETCHING
function Loader2({ size, className }: { size: number, className: string }) {
  return (
    <svg 
      width={size} height={size} viewBox="0 0 24 24" fill="none" 
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
      className={className}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function StatBox({ label, val, color }: { label: string, val: string, color: string }) {
  return (
    <div className={`${color} rounded-xl p-3 border border-white/10 flex flex-col shadow-inner`}>
      <p className="text-[7px] uppercase font-black text-white/40 tracking-widest mb-0.5 leading-none">{label}</p>
      <p className="text-[11px] font-black italic uppercase text-[#C5A059] tracking-tighter leading-none">{val}</p>
    </div>
  );
}

function PodiumRow({ label, years, icon, color }: { label: string; years: readonly string[]; icon: string; color: string }) {
  if (!years || years.length === 0) return null;
  return (
    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
      <p className={`text-[10px] uppercase font-black mb-2 flex items-center gap-2 ${color} leading-none`}>
        <span>{icon}</span> {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {years.map((y: string) => (
          <span key={y} className="bg-white/10 px-3 py-1 rounded-lg text-[10px] font-bold border border-white/10 leading-none">{y}</span>
        ))}
      </div>
    </div>
  );
}
