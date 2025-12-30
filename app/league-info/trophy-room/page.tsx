'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Trophy, ArrowLeft, Crown, Award, Medal, AlertTriangle, ChevronRight
} from 'lucide-react';
import { ModeToggle } from '@/components/ModeToggle';

// --- DATA: HALL OF CHAMPIONS (Restored & Locked) ---
const CHAMPIONS = [
  { year: 2025, name: "Aaron Hawkins", team: "Nudas Priest", avatar: "/managers/Aaron.png" },
  { year: 2024, name: "Jordan Maslyn", team: "Get.Your.Guy", avatar: "/managers/Jordan.jpg" },
  { year: 2023, name: "Tommy Moore", team: "The Ship of Theseus", avatar: "/managers/Tommy.png" },
  { year: 2022, name: "Tommy Moore", team: "The Hellfire Club", avatar: "/managers/Tommy.png" },
  { year: 2021, name: "David Besedich", team: "The Schmendricks", avatar: "/managers/Dave.png" },
  { year: 2020, name: "JD Dowling", team: "F U Minshew", avatar: "/managers/JD.png" },
  { year: 2019, name: "Wade Cameron", team: "Witchdoctors", avatar: "/managers/Wade.png" },
  { year: 2018, name: "Brian Stevens", team: "kerryon my wayward son", avatar: "/managers/Brian.png" },
  { year: 2017, name: "Tommy Moore", team: "Deez Lutz", avatar: "/managers/Tommy.png" },
  { year: 2016, name: "Tommy Moore", team: "Breesus Take the Wheel", avatar: "/managers/Tommy.png" },
  { year: 2015, name: "Keith Polarek", team: "Team Polarek", avatar: "/managers/Keith.png" },
  { year: 2014, name: "Garet Prior", team: "McCowen Town", avatar: "/managers/Garet.png" },
  { year: 2013, name: "Tommy Moore", team: "The Not That Great CornJulio", avatar: "/managers/Tommy.png" },
  { year: 2012, name: "Bryan Doane", team: "Drinkin' Irish", avatar: "/managers/Bryan.png" },
  { year: 2011, name: "Gordie Gahagan", team: "Freakshow Freaks", avatar: "/managers/Gordie.png" },
];

// --- DATA: PODIUM LEADERBOARD ---
const PODIUMS = [
  { rank: 1, name: "Tommy Moore", avatar: "/managers/Tommy.png", gold: 5, silver: 1, bronze: 1, total: 7 },
  { rank: 2, name: "JD Dowling", avatar: "/managers/JD.png", gold: 1, silver: 3, bronze: 1, total: 5 },
  { rank: 3, name: "Brian Stevens", avatar: "/managers/Brian.png", gold: 1, silver: 1, bronze: 2, total: 4 },
  { rank: 4, name: "Travis Miller", avatar: "/managers/Travis.png", gold: 0, silver: 3, bronze: 0, total: 3 },
  { rank: 5, name: "Wade Cameron", avatar: "/managers/Wade.png", gold: 1, silver: 2, bronze: 0, total: 3 },
  { rank: 6, name: "David Besedich", avatar: "/managers/Dave.png", gold: 1, smilver: 1, bronze: 1, total: 3 },
  { rank: 7, name: "Ray Long", avatar: "/managers/Ray.png", gold: 0, silver: 0, bronze: 3, total: 3 },
  { rank: 8, name: "James Minnix", avatar: "/managers/James.png", gold: 0, silver: 2, bronze: 1, total: 3 },
  { rank: 9, name: "Keith Polarek", avatar: "/managers/Keith.png", gold: 1, silver: 0, bronze: 1, total: 2 },
  { rank: 10, name: "Gordie Gahagan", avatar: "/managers/Gordie.png", gold: 1, silver: 1, bronze: 0, total: 2 },
  { rank: 11, name: "Bryan Doane", avatar: "/managers/Bryan.png", gold: 1, silver: 0, bronze: 1, total: 2 },
  { rank: 12, name: "Aaron Hawkins", avatar: "/managers/Aaron.png", gold: 1, silver: 0, bronze: 0, total: 1 },
  { rank: 13, name: "Jordan Maslyn", avatar: "/managers/Jordan.jpg", gold: 1, silver: 0, bronze: 0, total: 1 },
  { rank: 14, name: "Garet Prior", avatar: "/managers/Garet.png", gold: 1, silver: 0, bronze: 0, total: 1 },
  { rank: 15, name: "Doug Fordham", avatar: "/managers/Doug.jpg", gold: 0, silver: 0, bronze: 1, total: 1 },
];

// --- DATA: HALL OF SHAME ---
const LOSERS = [
  { year: 2025, name: "Ray Long", avatar: "/managers/Ray.png" },
  { year: 2024, name: "Rashad Gresham", avatar: "/managers/Rashad.png" },
  { year: 2023, name: "Landon Elliott", avatar: "/managers/Landon.png" },
  { year: 2022, name: "JD Dowling", avatar: "/managers/JD.png" },
  { year: 2021, name: "Jordan Maslyn", avatar: "/managers/Jordan.jpg" },
  { year: 2020, name: "Tommy Moore", avatar: "/managers/Tommy.png" },
  { year: 2019, name: "Tommy Moore", avatar: "/managers/Tommy.png" },
  { year: 2018, name: "Wade Cameron", avatar: "/managers/Wade.png" },
  { year: 2017, name: "Brian Stevens", avatar: "/managers/Brian.png" },
  { year: 2016, name: "Wade Cameron", avatar: "/managers/Wade.png" },
  { year: 2015, name: "Travis Miller", avatar: "/managers/Travis.png" },
  { year: 2014, name: "Landon Elliott", avatar: "/managers/Landon.png" },
  { year: 2013, name: "Travis Miller", avatar: "/managers/Travis.png" },
  { year: 2012, name: "Zach", avatar: null }, 
  { year: 2011, name: "Darren", avatar: null }, 
];

export default function TrophyRoomPage() {
  const [activeTab, setActiveTab] = useState<'champions' | 'leaderboard' | 'shame'>('champions');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212] transition-colors duration-300 font-sans selection:bg-orange-500 selection:text-white pb-20">
      
      {/* HEADER SECTION: RESPONSIVE */}
      <header className="pt-6 sm:pt-12 px-4 max-w-7xl mx-auto text-center relative border-b border-gray-200 dark:border-white/10 pb-8 sm:pb-12 text-gray-900 dark:text-white">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
            <Link href="/league-info" className="flex items-center gap-1 sm:gap-2 text-gray-500 hover:text-orange-600 transition-colors font-bold text-[10px] sm:text-sm uppercase tracking-widest">
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" /> League Info Hub
            </Link>
            <div className="mx-auto sm:mx-0 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-white dark:bg-[#1e1e1e] shadow-xl border-2 sm:border-4 border-gray-100 dark:border-white/5 overflow-hidden relative">
                 <Image src="/River City FFL Logo.JPG" alt="Logo" fill className="object-cover" priority unoptimized />
            </div>
            <ModeToggle />
        </div>
        
        <h1 className="mb-6 text-3xl sm:text-6xl font-black tracking-tighter uppercase drop-shadow-sm leading-none dark:text-[#f0c340]">
            Trophy <span className="text-orange-600 dark:text-white">Room</span>
        </h1>

        {/* TAB NAVIGATION: FLEX WRAP FOR MOBILE */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-8 px-2">
            <button onClick={() => setActiveTab('champions')} className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 rounded-full font-bold text-[10px] sm:text-xs flex items-center justify-center gap-2 transition-all ${activeTab === 'champions' ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'bg-white dark:bg-[#2c2c2c] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10'}`}>
                <Crown className="w-3 h-3 sm:w-4 sm:h-4" /> Champions
            </button>
            <button onClick={() => setActiveTab('leaderboard')} className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 rounded-full font-bold text-[10px] sm:text-xs flex items-center justify-center gap-2 transition-all ${activeTab === 'leaderboard' ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'bg-white dark:bg-[#2c2c2c] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10'}`}>
                <Trophy className="w-3 h-3 sm:w-4 sm:h-4" /> Podium
            </button>
            <button onClick={() => setActiveTab('shame')} className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 rounded-full font-bold text-[10px] sm:text-xs flex items-center justify-center gap-2 transition-all ${activeTab === 'shame' ? 'bg-gray-700 text-white shadow-lg' : 'bg-white dark:bg-[#2c2c2c] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10'}`}>
                <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4" /> Shame
            </button>
        </div>
      </header>

      {/* CONTENT AREA: RESPONSIVE GRID */}
      <main className="px-4 py-8 sm:py-12 max-w-7xl mx-auto">
        
        {activeTab === 'champions' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {CHAMPIONS.map((champ) => (
                    <div key={`${champ.year}-${champ.name}`} className="bg-white dark:bg-[#1e1e1e] rounded-[2rem] shadow-lg border border-gray-200 dark:border-white/10 overflow-hidden group transition-all duration-300 relative">
                        <div className="h-24 sm:h-32 bg-gradient-to-br from-yellow-400 via-orange-500 to-yellow-600 flex items-center justify-center relative overflow-hidden">
                            <div className="text-7xl sm:text-9xl font-black text-white/10 absolute -bottom-5 select-none">{champ.year}</div>
                            <Trophy className="w-10 h-10 sm:w-14 sm:h-14 text-white drop-shadow-md relative z-10" />
                        </div>
                        <div className="p-6 sm:p-8 text-center -mt-10 sm:-mt-14 relative z-10">
                            <div className="w-20 h-20 sm:w-24 h-24 mx-auto rounded-full border-[4px] sm:border-[6px] border-white dark:border-[#1e1e1e] shadow-xl overflow-hidden bg-gray-200 relative">
                                {champ.avatar ? (
                                    <Image src={champ.avatar} alt={champ.name} fill className="object-cover" unoptimized />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-500 font-bold text-xl">{champ.name[0]}</div>
                                )}
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mt-4">{champ.year}</h2>
                            <h3 className="text-[10px] sm:text-xs font-bold text-orange-600 dark:text-yellow-500 uppercase tracking-widest mb-3 sm:mb-4">{champ.name}</h3>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-white/5 py-2 px-3 rounded-xl inline-block truncate max-w-full">{champ.team}</div>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {activeTab === 'leaderboard' && (
            <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl sm:rounded-3xl shadow-xl border border-gray-200 dark:border-white/10 overflow-hidden animate-in fade-in duration-500">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[500px] sm:min-w-0">
                        <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                            <tr className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest">
                                <th className="px-4 sm:px-8 py-4 sm:py-6">Rank</th>
                                <th className="px-4 sm:px-8 py-4 sm:py-6">Manager</th>
                                <th className="px-4 sm:px-8 py-4 sm:py-6 text-center text-yellow-500">Gold</th>
                                <th className="px-4 sm:px-8 py-4 sm:py-6 text-center text-gray-400">Silver</th>
                                <th className="px-4 sm:px-8 py-4 sm:py-6 text-center text-orange-700">Bronze</th>
                                <th className="px-4 sm:px-8 py-4 sm:py-6 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-xs sm:text-base">
                            {PODIUMS.map((p) => (
                                <tr key={p.name} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                    <td className="px-4 sm:px-8 py-4 sm:py-6 font-mono text-gray-400 group-hover:text-orange-600 transition-colors">#{p.rank}</td>
                                    <td className="px-4 sm:px-8 py-4 sm:py-6">
                                        <div className="flex items-center gap-2 sm:gap-4">
                                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden relative shadow-sm border border-gray-100 dark:border-white/10 shrink-0">
                                                {p.avatar ? (
                                                    <Image src={p.avatar} alt={p.name} fill className="object-cover" unoptimized />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-500">{p.name[0]}</div>
                                                )}
                                            </div>
                                            <span className="font-bold text-gray-900 dark:text-white truncate max-w-[80px] sm:max-w-none">{p.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 sm:px-8 py-4 sm:py-6 text-center font-black text-yellow-600 dark:text-yellow-500">{p.gold}</td>
                                    <td className="px-4 sm:px-8 py-4 sm:py-6 text-center font-bold text-gray-500">{p.silver}</td>
                                    <td className="px-4 sm:px-8 py-4 sm:py-6 text-center font-bold text-orange-700">{p.bronze}</td>
                                    <td className="px-4 sm:px-8 py-4 sm:py-6 text-right font-black text-lg sm:text-2xl text-gray-900 dark:text-white">{p.total}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {activeTab === 'shame' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-6 animate-in fade-in duration-500 text-center">
                {LOSERS.map((loser) => (
                    <div key={loser.year} className="bg-white dark:bg-[#1e1e1e] rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-white/10 p-4 sm:p-8 flex flex-col items-center justify-center relative group hover:border-red-500/50 transition-all shadow-sm">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-200 dark:bg-gray-800 mb-3 sm:mb-4 relative overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-500 border-2 border-gray-100 dark:border-white/5 shadow-inner shrink-0">
                            {loser.avatar ? (
                                <Image src={loser.avatar} alt={loser.name} fill className="object-cover" unoptimized />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-lg font-bold text-gray-500">{loser.name[0]}</div>
                            )}
                            <div className="absolute bottom-0 right-0 bg-red-600 text-white text-[8px] sm:text-[10px] w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full border-2 border-white dark:border-[#1e1e1e] shadow-sm">💩</div>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white leading-none mb-2">{loser.year}</h3>
                        <p className="text-[8px] sm:text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase leading-tight tracking-tighter truncate w-full px-1">{loser.name}</p>
                    </div>
                ))}
            </div>
        )}

      </main>
    </div>
  );
}