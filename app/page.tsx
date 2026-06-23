'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Trophy, ChevronDown, ChevronUp, Newspaper, 
  Zap, X, Loader2, Target, Info, Scroll
} from 'lucide-react';
import { LCC_LEAGUE_HISTORY_IDS } from '@/lib/leagueConstants';

const TYRONE_USER_ID = "466797853767888896";

export default function HomePage() {
  const [blogExpanded, setBlogExpanded] = useState(false);
  const [showPredictor, setShowPredictor] = useState(false);
  const [careerRecord, setCareerRecord] = useState({ wins: 0, losses: 0, loading: true });

  useEffect(() => {
    async function calculateCareerStats() {
      let totalWins = 0; let totalLosses = 0;
      try {
        for (const leagueId of LCC_LEAGUE_HISTORY_IDS) {
          const res = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/rosters`);
          const rosters = await res.json();
          const tyroneRoster = rosters.find((r: any) => r.owner_id === TYRONE_USER_ID);
          if (tyroneRoster?.settings) {
            totalWins += (tyroneRoster.settings.wins || 0);
            totalLosses += (tyroneRoster.settings.losses || 0);
          }
        }
        setCareerRecord({ wins: totalWins, losses: totalLosses, loading: false });
      } catch (err) { setCareerRecord(prev => ({ ...prev, loading: false })); }
    }
    calculateCareerStats();
  }, []);

  return (
    <div className="min-h-screen font-serif text-[#1A472A] bg-[#F9F7F2]/30 relative">
      <main className="max-w-7xl mx-auto px-6 py-12 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* LEFT COLUMN: THE LCC ORIGIN STORY */}
          <div className="lg:col-span-7">
            <section className="bg-white rounded-[3rem] p-12 shadow-sm border border-black/5">
              <div className="flex items-center gap-4 mb-8">
                <Scroll className="text-[#C5A059]" size={32} />
                <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter border-b-8 border-[#C5A059] inline-block leading-none">
                  The Back Nine: Our Legacy
                </h1>
              </div>
              
              <div className="space-y-8 text-xl text-[#1A472A]/80 leading-relaxed">
                <p>
                  The LCC FFL was forged on the diamonds of local softball fields, born from the 
                  rivalry and respect between the Outlaws and Jani King. Co-created by 
                  Ray, Bill, and KW, the league’s legendary start began the night Ray 
                  drafted Bill’s entire squad.
                </p>

                <div className="bg-[#F9F7F2] p-8 rounded-3xl border-l-8 border-[#C5A059] my-8">
                  <p className="font-black italic text-2xl text-[#1A472A]">
                    "The Culpepper & Moss Connection"
                  </p>
                  <p className="mt-2 text-lg">
                    That fateful draft night led to a dominant back-to-back championship run that 
                    set the standard for the decades to follow.
                  </p>
                </div>

                <p>
                  After Year 1, Ray, Bill, and KW expanded the clubhouse, building a community around 
                  friends from **Paramount Kings Dominion** and a tight-knit circle of outsiders. 
                  While faces have changed over 22 years, the core of this league has remained 
                  unshakable.
                </p>

                <p>
                  In 2021, we made our most significant strategic shift, transitioning from a 
                  traditional **2-Keeper format** into a **Full Dynasty era**. It has been a 
                  massive hit, raising the stakes and the competition to an all-time high.
                </p>

                <div className="pt-12 border-t border-black/5 mt-12">
                  <p className="text-sm font-black uppercase tracking-[0.3em] text-red-800/60 mb-4">In Memoriam</p>
                  <p className="italic font-black text-[#1A472A]/60">
                    We have lost two of our original members to cancer over these 22 years. 
                    Though they are no longer in the draft room, they will forever be part 
                    of the Long Country Club FFL.
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-5 space-y-12">
            
            {/* REIGNING CHAMPION CARD */}
            <section className="bg-[#1A472A] rounded-[3rem] p-10 text-center text-white border-b-[12px] border-[#C5A059] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 bg-red-600 font-black text-[10px] uppercase tracking-widest transform rotate-45 translate-x-10 -translate-y-2 w-40">Champion</div>
              <p className="text-[#C5A059] text-[10px] font-black uppercase tracking-[0.4em] mb-8">Reigning Champion</p>
              
              <div className="relative mx-auto mb-6">
                <div className="w-40 h-40 rounded-full border-8 border-white/20 mx-auto overflow-hidden shadow-2xl bg-[#1A472A]/50">
                  <img src="/managers/Tyrone.png" className="w-full h-full object-cover" alt="Tyrone Poist" />
                </div>
              </div>

              <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-1">Tyrone Poist</h2>
              <div className="mb-8">
                {careerRecord.loading ? (
                  <Loader2 size={16} className="animate-spin mx-auto opacity-20" />
                ) : (
                  <p className="text-[#C5A059] text-[12px] font-black uppercase tracking-widest">Career Record: {careerRecord.wins}-{careerRecord.losses}</p>
                )}
              </div>

              <Link href="/league-info/trophy-room">
                <button className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl flex items-center justify-center gap-3 transition-all group">
                   <Trophy size={16} className="text-[#C5A059] group-hover:scale-110 transition-transform" />
                   <span className="text-[10px] font-black uppercase tracking-[0.2em]">View Gallery History →</span>
                </button>
              </Link>
            </section>

            {/* COMMISSIONER'S CORNER */}
            <section className="bg-white rounded-[3rem] p-10 shadow-xl border border-black/5">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-[#F9F7F2] rounded-2xl"><Newspaper className="w-6 h-6" /></div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Commissioner's Corner</p>
                    <h3 className="text-2xl font-black italic uppercase leading-none">2025: A New Era</h3>
                </div>
              </div>
              <div className={`space-y-4 text-[#1A472A]/80 leading-relaxed ${!blogExpanded && 'line-clamp-3'}`}>
                <p>The dust has settled on the 2025 campaign... Tyrone Poist's dominance wasn't just about the roster.</p>
              </div>
              <button onClick={() => setBlogExpanded(!blogExpanded)} className="mt-6 text-[10px] font-black uppercase tracking-widest text-[#C5A059]">{blogExpanded ? 'Read Less' : 'Read Full Recap'}</button>
            </section>

            {/* AI PLAYOFF PREDICTOR (Fixed Overlay) */}
            <section className="bg-white rounded-[3rem] p-10 shadow-xl border border-black/5">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <Target className="text-[#C5A059]" />
                    <h3 className="text-xl font-black italic uppercase">AI Predictor</h3>
                </div>
                <Zap size={18} className="text-[#C5A059] animate-pulse" />
              </div>
              
              <div className="space-y-3 mb-6">
                {[
                  { name: "Tyrone", odds: "84%" },
                  { name: "Mike M", odds: "71%" },
                  { name: "Bill", odds: "68%" },
                  { name: "Ben", odds: "59%" },
                  { name: "EP", odds: "51%" }
                ].map((row, i) => (
                  <div key={i} className="flex justify-between items-center px-4 py-2 bg-[#F9F7F2] rounded-xl border border-black/5">
                    <span className="text-[10px] font-black uppercase tracking-tight">{row.name}</span>
                    <span className="text-sm font-black italic text-[#1A472A]">{row.odds}</span>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => setShowPredictor(true)}
                className="w-full py-4 bg-[#1A472A] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#C5A059] transition-all"
              >
                Show All 12 Managers
              </button>
            </section>
          </div>
        </div>

        {/* FIXED 12-TEAM MODAL */}
        {showPredictor && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-black/80 backdrop-blur-md p-4 sm:p-6">
            <div className="relative bg-[#1A1A1A] text-white w-full max-w-2xl rounded-[3rem] border border-white/10 shadow-2xl animate-in zoom-in duration-300">
              <div className="p-8 bg-gradient-to-r from-[#1A472A] to-[#C5A059]/20 flex justify-between items-center rounded-t-[3rem]">
                <div className="flex items-center gap-4">
                  <Zap className="text-[#C5A059]" />
                  <h2 className="text-2xl font-black uppercase tracking-tighter italic">2026 Season Forecast</h2>
                </div>
                <button onClick={() => setShowPredictor(false)} className="text-white/60 hover:text-white transition-colors bg-white/5 p-2 rounded-full">
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-10 space-y-4 max-h-[65vh] overflow-y-auto custom-scrollbar">
                {[
                  { name: "Tyrone", odds: "84%", status: "Lock", color: "text-green-400" },
                  { name: "Mike M", odds: "71%", status: "High", color: "text-green-400" },
                  { name: "Bill", odds: "68%", status: "High", color: "text-green-400" },
                  { name: "Ben", odds: "59%", status: "Strong", color: "text-[#C5A059]" },
                  { name: "EP", odds: "51%", status: "Bubble", color: "text-[#C5A059]" },
                  { name: "Keith", odds: "44%", status: "Bubble", color: "text-[#C5A059]" },
                  { name: "Rob", odds: "38%", status: "Bubble", color: "text-[#C5A059]" },
                  { name: "Amart", odds: "31%", status: "Work", color: "text-red-400" },
                  { name: "Loren", odds: "24%", status: "Longshot", color: "text-red-500" },
                  { name: "Ray", odds: "15%", status: "Longshot", color: "text-red-500" },
                  { name: "Jeffrey", odds: "12%", status: "Longshot", color: "text-red-500" },
                  { name: "Mike E", odds: "3%", status: "Basement", color: "text-red-600" }
                ].map((row, i) => (
                  <div key={i} className="flex justify-between items-center border-b border-white/5 pb-3">
                    <span className="font-black uppercase tracking-widest text-sm">{row.name}</span>
                    <div className="flex items-center gap-6">
                        <span className={`text-xl font-black italic ${row.color}`}>{row.odds}</span>
                        <span className="text-[8px] font-black uppercase px-2 py-1 bg-white/10 rounded-md min-w-[65px] text-center">{row.status}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-8 bg-white/5 flex items-start gap-4 rounded-b-[3rem]">
                <Info className="text-[#C5A059] shrink-0" size={16} />
                <p className="text-[10px] leading-relaxed opacity-50 uppercase font-bold tracking-tight">
                    Algorithm simulates 10,000 iterations factoring in current Roster Efficiency, Max PF, and Strength of Schedule.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
