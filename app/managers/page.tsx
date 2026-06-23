'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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

const ACTIVE_MANAGERS = [
  { id: "342828350391230464", name: "Ray", sleeper: "Bower Rangers", joined: 2003, div: "OG", status: "FOUNDER", isCommish: true, team: "atl", rival: "Jeffrey", cell: "8046471100", aggro: 10, titles: 1, podiums: { first: ["2007"], second: ["2005", "2008", "2014"], third: ["2009", "2021"] } },
  { id: "466780021365665792", name: "Bill", sleeper: "Chicago Cutlers", joined: 2003, div: "OG", status: "FOUNDER", isCommish: false, team: "chi", rival: "Ray", cell: "8043077897", aggro: 3, titles: 4, podiums: { first: ["2003", "2005", "2006", "2018"], second: ["2016", "2024"], third: ["2013"] } },
  { id: "466638004102885376", name: "KW", sleeper: "Off Constantly", joined: 2003, div: "OG", status: "FOUNDER", isCommish: false, team: "was", rival: "Bill", cell: "8048526684", aggro: 3, titles: 1, podiums: { first: ["2020"], second: ["2004", "2017"], third: ["2015", "2023"] } },
  { id: "467786127214899200", name: "Rob", sleeper: "Roaring 20", joined: 2004, div: "OG", status: "OG", isCommish: false, team: "det", rival: "Ray", cell: "8044008140", aggro: 9, titles: 2, podiums: { first: ["2014"], second: ["2005", "2009", "2017", "2021"], third: ["2015", "2016", "2020"] } },
  { id: "466645286870052864", name: "EP", sleeper: "The People's Team", joined: 2004, div: "OG", status: "OG", isCommish: false, team: "phi", rival: "Bill", cell: "447825990288", aggro: 9, titles: 1, podiums: { first: ["2022"], second: ["2020"], third: ["2006", "2008", "2018", "2023"] } },
  { id: "356621920969555968", name: "Jeffrey", sleeper: "CeeDees....Cousins", joined: 2007, div: "OG", status: "OG", isCommish: false, team: "atl", rival: "Ray", cell: "4049318499", aggro: 6, titles: 1, podiums: { first: ["2024"], second: ["2013", "2019"], third: ["2023"] } },
  { id: "466797853767888896", name: "Tyrone", sleeper: "Won't You be my Nabers", joined: 2004, div: "NEWBIE", status: "CHAMP", isCommish: false, team: "nyg", rival: "Ben", cell: "7577617610", aggro: 5, titles: 2, podiums: { first: ["2015", "2025"], second: ["2016"], third: ["2004"] } },
  { id: "346727603970973696", name: "Ben", sleeper: "Benl", joined: 2008, div: "NEWBIE", status: "VET", isCommish: false, team: "dal", rival: "Tyrone", cell: "8043146253", aggro: 3, titles: 2, podiums: { first: ["2011", "2016"], second: ["2015", "2022", "2023", "2024"], third: ["2025"] } },
  { id: "466645950710935552", name: "Loren", sleeper: "ICOR 4 Lyfe", joined: 2011, div: "NEWBIE", status: "VET", isCommish: false, team: "atl", rival: "Ben", cell: "8285459802", aggro: 8, titles: 1, podiums: { first: ["2021"], second: ["2011", "2023"], third: ["2012", "2024"] } },
  { id: "466659300316540928", name: "Mike M", sleeper: "CookieMonsters", joined: 2018, div: "NEWBIE", status: "VET", isCommish: false, team: "phi", rival: "Ray", cell: "8042399371", aggro: 5, titles: 1, podiums: { first: ["2019", "2023"], second: ["2020", "2025"], third: [] } },
  { id: "468192726756618240", name: "Amart", sleeper: "Sycamore Bishops", joined: 2020, div: "NEWBIE", status: "ACTIVE", isCommish: false, team: "pit", rival: "Mike E", cell: "8048524252", aggro: 8, titles: 0, podiums: { first: [], second: [], third: ["2021"] } },
  { id: "817056809218080768", name: "Mike E", sleeper: "Redneck Rebels", joined: 2022, div: "NEWBIE", status: "ACTIVE", isCommish: false, team: "was", rival: "Amart", cell: "8044024955", aggro: 9, titles: 0, podiums: { first: [], second: [], third: ["2025"] } }
];

const RETIRED_MANAGERS = [
  { name: "Dan", sleeper: "Ridiculousville Quicksand", joined: 2006, status: "RETIRED", team: "atl", titles: 3, podiums: { first: ["2012", "2013", "2017"], second: [], third: [] } },
  { name: "Chris H", sleeper: "Boss Hogg is Back Baby!", joined: 2005, status: "RETIRED", team: "was", titles: 1, podiums: { first: ["2008"], second: ["2006", "2007"], third: ["2005"] } },
  { name: "DJ", sleeper: "H.S. Serial Killers", joined: 2006, status: "RETIRED", team: "was", titles: 1, podiums: { first: ["2010"], second: [], third: [] } },
  { name: "JD", sleeper: "JD", joined: 2003, status: "FOUNDER", team: "mia", titles: 0, podiums: { first: [], second: ["2013"], third: ["2007"] } },
  { name: "David G", sleeper: "British Bulldogs", joined: 2006, status: "RETIRED", team: "chi", titles: 0, podiums: { first: [], second: [], third: ["2008"] } },
  { name: "Matt", sleeper: "Matt H", joined: 2008, status: "RETIRED", team: "was", titles: 0, podiums: { first: [], second: ["2012", "2020"], third: ["2010", "2011", "2014"] } },
  { name: "David B", sleeper: "CAM You Dig It?!", joined: 2006, status: "RETIRED", team: "car", titles: 0, podiums: { first: [], second: [], third: ["2013"] } },
  { name: "KD", sleeper: "KD", joined: 2003, status: "FOUNDER", team: "buf", titles: 0, podiums: { first: [], second: ["2005"], third: ["2003", "2004", "2006"] } },
  { name: "Bernie", sleeper: "Bernie", joined: 2003, status: "FOUNDER", team: "was", titles: 0, podiums: { first: [], second: [], third: ["2003"] } },
  { name: "BJ", sleeper: "BJ", joined: 2003, status: "FOUNDER", team: "was", titles: 0, podiums: { first: [], second: [], third: [] } },
  { name: "Chris B", sleeper: "Chris B", joined: 2003, status: "MEMORIAL", team: "mia", titles: 0, podiums: { first: [], second: ["2012"], third: [] } },
  { name: "Junior", sleeper: "Junior", joined: 2003, status: "MEMORIAL", team: "was", titles: 0, podiums: { first: [], second: [], third: [] } },
  { name: "Chris M", sleeper: "Chris M", joined: 2005, status: "RETIRED", team: "dal", titles: 0, podiums: { first: [], second: [], third: [] } },
  { name: "Jay", sleeper: "Vitamin J", joined: 2003, status: "FOUNDER", team: "mia", titles: 0, podiums: { first: [], second: [], third: [] } },
  { name: "Tommy", sleeper: "Tommy", joined: 2008, status: "RETIRED", team: "dal", titles: 0, podiums: { first: [], second: [], third: [] } },
  { name: "Mike L", sleeper: "Mike L", joined: 2008, status: "RETIRED", team: "nyg", titles: 0, podiums: { first: [], second: [], third: [] } }
];

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
              <h2 className="text-2xl font-black italic uppercase text-[#1A472A] mb-12 border-b-8 border-[#C5A059] inline-block px-2 tracking-widest leading-none">The Founders & OG's</h2>
              <div className="clubhouse-grid">
                {ACTIVE_MANAGERS.filter(m => m.div === "OG").map((m, i) => <ButtonFlipCard key={i} manager={m} />)}
              </div>
            </section>
            <section>
              <h2 className="text-2xl font-black italic uppercase text-[#1A472A] mb-12 border-b-8 border-[#1A472A] inline-block px-2 tracking-widest leading-none">The Newbie Division</h2>
              <div className="clubhouse-grid">
                {ACTIVE_MANAGERS.filter(m => m.div === "NEWBIE").map((m, i) => <ButtonFlipCard key={i} manager={m} />)}
              </div>
            </section>
          </div>
        ) : (
          <section>
            <h2 className="text-2xl font-black italic uppercase text-[#1A472A] mb-12 border-b-8 border-gray-400 inline-block px-2 tracking-widest leading-none">Hall of Fame</h2>
            <div className="clubhouse-grid">
              {RETIRED_MANAGERS.map((m, i) => <ButtonFlipCard key={i} manager={m} isRetired={true} />)}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function ButtonFlipCard({ manager, isRetired = false }: any) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [record, setRecord] = useState({ wins: 0, losses: 0, loading: !isRetired });
  const theme = TEAM_THEMES[manager.team] || { bg: 'bg-[#420d09]', border: 'border-white/10' };
  const titles = manager.titles || 0;
  const totalPodiums = (manager.podiums.first?.length || 0) + (manager.podiums.second?.length || 0) + (manager.podiums.third?.length || 0);

  // FETCH CAREER RECORD
  useEffect(() => {
    if (isRetired || !manager.id) return;
    
    async function fetchStats() {
      let w = 0; let l = 0;
      try {
        for (const leagueId of LCC_LEAGUE_HISTORY_IDS) {
          const res = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/rosters`);
          const rosters = await res.json();
          const roster = rosters.find((r: any) => r.owner_id === manager.id);
          if (roster?.settings) {
            w += (roster.settings.wins || 0);
            l += (roster.settings.losses || 0);
          }
        }
        setRecord({ wins: w, losses: l, loading: false });
      } catch (err) { setRecord(prev => ({ ...prev, loading: false })); }
    }
    fetchStats();
  }, [manager.id, isRetired]);

  return (
    <div className={`flip-card ${isRetired ? 'grayscale-[0.4] hover:grayscale-0 transition-all duration-500' : ''}`}>
      <div className={`flip-card-inner ${isFlipped ? 'is-flipped' : ''}`}>
        
        {/* FRONT SIDE */}
        <div className={`flip-card-front flex flex-col p-6 text-white ${theme.bg} border-4 ${theme.border} shadow-2xl relative overflow-hidden`}>
          
          <div className="w-full flex justify-between items-start mb-6">
             <div className="flex flex-col gap-1">
                {manager.isCommish && <span className="bg-[#C5A059] text-black text-[7px] font-black px-2 py-0.5 rounded uppercase tracking-widest w-fit border border-white/20 shadow-md">👑 COMMISH</span>}
                <span className={`${manager.status === 'MEMORIAL' ? 'bg-white text-black' : 'bg-black/40 text-white'} text-[7px] font-black px-2 py-0.5 rounded uppercase tracking-widest w-fit border border-white/10`}>
                   {manager.status === 'MEMORIAL' ? '🕊️ IN MEMORIAM' : manager.status}
                </span>
             </div>
             <button onClick={() => setIsFlipped(true)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all cursor-pointer">🔄</button>
          </div>

          <h2 className="text-2xl font-black uppercase tracking-tighter leading-tight mb-1">{manager.sleeper}</h2>
          <p className="text-[10px] font-bold text-white/60 mb-6">{manager.name} • EST {manager.joined}</p>

          <div className="flex items-center gap-6 mb-6">
             <div className="relative shrink-0">
                <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden shadow-2xl bg-white/5">
                   <img src={`/managers/${manager.name}.png`} className="w-full h-full object-cover" onError={(e)=>e.currentTarget.src="/logos/Sleeper.png"} alt={manager.name} />
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
                    <a href={`sms:${manager.cell}`}><img src="/logos/iMessage.png" className="w-9 h-9 hover:scale-110 transition-transform shadow-lg" alt="iMessage" /></a>
                  )}
                  <img src="/logos/Sleeper.png" className="w-6 h-6 opacity-40" alt="Sleeper" />
                </div>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-6">
            <StatBox label="Favorite Team" val={manager.team.toUpperCase()} color="bg-black/30" />
            <StatBox label="Status" val={isRetired ? "Legend" : manager.status} color="bg-black/30" />
          </div>

          {!isRetired && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[8px] uppercase font-black tracking-widest text-white/50 italic leading-none">Trade Aggression</span>
                <span className="text-[9px] font-black text-[#C5A059]">{manager.aggro}/10</span>
              </div>
              <div className="h-2 w-full bg-black/30 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-gradient-to-r from-red-600 via-yellow-400 to-green-500 rounded-full" 
                  style={{ width: `${manager.aggro * 10}%` }} 
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
                   {manager.rival ? (
                     <>
                        <div className="w-8 h-8 rounded-full border-2 border-white/20 overflow-hidden bg-white/5">
                           <img src={`/managers/${manager.rival}.png`} className="w-full h-full object-cover" onError={(e)=>e.currentTarget.src="/logos/Sleeper.png"} alt="Rival" />
                        </div>
                        <span className="text-[11px] font-black uppercase italic tracking-tighter leading-none">{manager.rival}</span>
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
            <PodiumRow label="League Champion" years={manager.podiums.first || []} icon="🥇" color="text-yellow-400" />
            <PodiumRow label="Runner Up" years={manager.podiums.second || []} icon="🥈" color="text-gray-400" />
            <PodiumRow label="Third Place" years={manager.podiums.third || []} icon="🥉" color="text-amber-700" />
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

function PodiumRow({ label, years, icon, color }: any) {
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
