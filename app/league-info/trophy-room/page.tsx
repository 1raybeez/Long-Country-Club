'use client';

import React from 'react';
import Link from 'next/link';
import { Trophy, ArrowLeft } from 'lucide-react';

// --- MANAGER DATASETS ---
const ACTIVE_MANAGERS = [
  { name: "Ray", sleeper: "Bower Rangers", joined: 2003, image: "/managers/Ray.png" },
  { name: "Bill", sleeper: "Chicago Cutlers", joined: 2003, image: "/managers/Bill.png" },
  { name: "KW", sleeper: "Off Constantly", joined: 2003, image: "/managers/KW.png" },
  { name: "Rob", sleeper: "Roaring 20", joined: 2004, image: "/managers/Rob.png" },
  { name: "EP", sleeper: "The People's Team", joined: 2004, image: "/managers/EP.png" },
  { name: "Jeffrey", sleeper: "CeeDees....Cousins", joined: 2007, image: "/managers/Jeffrey.png" },
  { name: "Tyrone", sleeper: "Won't You be my Nabers", joined: 2004, image: "/managers/Tyrone.png" },
  { name: "Ben", sleeper: "Benl", joined: 2008, image: "/managers/Ben.png" },
  { name: "Loren", sleeper: "ICOR 4 Lyfe", joined: 2011, image: "/managers/Loren.png" },
  { name: "Mike M", sleeper: "CookieMonsters", joined: 2018, image: "/managers/Mike M.png" },
  { name: "Amart", sleeper: "Sycamore Bishops", joined: 2020, image: "/managers/Amart.png" },
  { name: "Mike E", sleeper: "Redneck Rebels", joined: 2022, image: "/managers/Mike E.png" }
];

const RETIRED_MANAGERS = [
  { name: "Dan", sleeper: "Ridiculousville Quicksand", image: "/managers/Dan.png" },
  { name: "Chris H", sleeper: "Boss Hogg is Back Baby!", image: "/managers/Chris H.png" },
  { name: "DJ", sleeper: "H.S. Serial Killers", image: "/managers/DJ.png" },
  { name: "JD", sleeper: "JD", image: "/managers/JD.png" },
  { name: "David G", sleeper: "British Bulldogs", image: "/managers/David G.png" },
  { name: "Matt", sleeper: "Matt H", image: "/managers/Matt.png" },
  { name: "KD", sleeper: "KD", image: "/managers/KD.png" },
  { name: "Chris B", sleeper: "Chris B", image: "/managers/Chris B.png" },
  { name: "Junior", sleeper: "Junior", image: "/managers/Junior.png" }
];

// Combine for easy lookup
const ALL_MGRS = [...ACTIVE_MANAGERS, ...RETIRED_MANAGERS];

const TROPHY_DATA = [
  // Dynasty Era (2019-Present)
  { year: 2025, champ: "Tyrone" },
  { year: 2024, champ: "Jeffrey" },
  { year: 2023, champ: "Mike M" },
  { year: 2022, champ: "EP" },
  { year: 2021, champ: "Loren" },
  { year: 2020, champ: "KW" },
  { year: 2019, champ: "Mike M" },
  // Historical Era (2003-2018)
  { year: 2018, champ: "Bill" },
  { year: 2017, champ: "Dan" },
  { year: 2016, champ: "Ben" },
  { year: 2015, champ: "Tyrone" },
  { year: 2014, champ: "Rob" },
  { year: 2013, champ: "Dan" },
  { year: 2012, champ: "Dan" },
  { year: 2011, champ: "Ben" },
  { year: 2010, champ: "DJ" },
  { year: 2009, champ: "Ben" },
  { year: 2008, champ: "Chris H" },
  { year: 2007, champ: "Ray" },
  { year: 2006, champ: "Bill" },
  { year: 2005, champ: "Bill" },
  { year: 2004, champ: "Rob" },
  { year: 2003, champ: "Bill" },
];

export default function TrophyRoom() {
  return (
    <div className="min-h-screen bg-[#111] text-white font-serif pb-24">
      
      {/* HEADER BLOCK */}
      <header className="py-20 px-6 text-center bg-gradient-to-b from-[#1A472A] to-[#111] relative overflow-hidden">
        <div className="absolute top-8 left-8">
          <Link href="/league-info" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-[#C5A059] transition-colors">
            <ArrowLeft size={14} /> Back to Clubhouse
          </Link>
        </div>
        <Trophy size={48} className="mx-auto text-[#C5A059] mb-4" />
        <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter mb-2">
          Champions <span className="text-[#C5A059]">Gallery</span>
        </h1>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">The Legends of Long Country Club</p>
      </header>

      <main className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
          {TROPHY_DATA.map((item) => {
            const manager = ALL_MGRS.find(m => m.name === item.champ);
            return (
              <div key={item.year} className="group relative bg-[#1A1A1A] rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl transition-all hover:scale-[1.02] hover:border-[#C5A059]/30">
                
                {/* Year Badge Strip */}
                <div className="h-40 bg-gradient-to-br from-[#C5A059] to-[#8a6d3b] flex items-center justify-center relative">
                  <span className="absolute text-[8rem] font-black text-white/10 -bottom-8 -left-4 select-none">{item.year}</span>
                  <Trophy size={48} className="text-white relative z-10 drop-shadow-lg" />
                  
                  {/* RED CHAMPION SASH */}
                  <div className="absolute top-4 right-4 bg-red-600 text-white font-black text-[9px] uppercase px-4 py-1 rotate-12 shadow-lg rounded-sm border border-white/20 z-20">
                    Champion
                  </div>
                </div>

                {/* Manager Image */}
                <div className="relative -mt-20 flex justify-center">
                  <div className="w-40 h-40 rounded-full border-8 border-[#1A1A1A] overflow-hidden shadow-2xl bg-[#222] z-10">
                    <img 
                      src={manager?.image || '/managers/default.png'} 
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                      alt={item.champ}
                      onError={(e: any) => e.target.src = "/managers/default.png"}
                    />
                  </div>
                </div>

                {/* Info Block */}
                <div className="p-10 text-center">
                  <h2 className="text-6xl font-black italic uppercase tracking-tighter text-white mb-2">{item.year}</h2>
                  <h3 className="text-2xl font-black uppercase text-[#C5A059] mb-4">
                    {manager ? (item.champ === "Mike M" ? "Mike McBurnie" : manager.name) : item.champ}
                  </h3>
                  
                  {/* Correct Team Name from Dataset */}
                  <div className="inline-block px-6 py-2 rounded-full bg-white/5 text-[10px] font-black uppercase tracking-widest text-white/60">
                    {manager?.sleeper || "2-Keeper Era"}
                  </div>
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-[#C5A059]/5 to-transparent pointer-events-none" />
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}