'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ArrowLeft, BookOpen, Music, Mic2, Globe, BarChart3, 
  ChevronRight, Radio
} from 'lucide-react';
import { ModeToggle } from '@/components/ModeToggle';

// --- DATA REMAINS UNCHANGED (192 LINES PRESERVED) ---
const BROADCAST_FEED = [
  { year: "2025", label: "Draft Kit", link: "https://music.apple.com/us/playlist/2025-river-city-ffl/pl.u-mJy88LDtBYqpd1" },
  { year: "2024", label: "Archive", link: "https://music.apple.com/us/playlist/2024-river-city-ffl/pl.u-11zBXZouZKBzgm" },
  { year: "2023", label: "Archive", link: "https://music.apple.com/us/playlist/2023-river-city-ffl/pl.u-V9D7mXEH1jgmDJ" },
  { year: "2022", label: "Archive", link: "https://music.apple.com/us/playlist/2022-river-city-ffl/pl.u-11zBJWySZKBzgm" },
];

const PODCASTS = [
  { name: "The Fantasy Footballers", desc: "Award-winning analysis and entertaining start/sit advice.", url: "https://music.apple.com/us/podcast/the-fantasy-footballers-fantasy-football-podcast/id1023761733", type: "Free" },
  { name: "The Ringer Fantasy Show", desc: "High-energy draft strategy and weekly waiver wire deep dives.", url: "https://music.apple.com/us/podcast/the-ringer-fantasy-football-show/id1524039715", type: "Free" },
  { name: "Fantasy Pros Podcast", desc: "Consensus rankings and expert advice hub in audio form.", url: "https://music.apple.com/us/podcast/fantasypros-fantasy-football-podcast/id1138942145", type: "Free" },
  { name: "Fantasy Football Focus", desc: "Daily news and strategic advice from the ESPN crew.", url: "https://music.apple.com/us/podcast/fantasy-football-focus/id263252794", type: "Free" },
  { name: "Fantasy Football Today", desc: "CBS Sports' daily breakdown of every game and every player.", url: "https://music.apple.com/us/podcast/fantasy-football-today/id261735167", type: "Free" },
  { name: "Establish the Run", desc: "Elite analytics and projections from Evan Silva and Adam Levitan.", url: "https://music.apple.com/us/podcast/establish-the-run-fantasy-football/id1473533244", type: "Free" },
  { name: "The Late-Round Podcast", desc: "JJ Zachariason's data-driven approach to finding sleepers.", url: "https://music.apple.com/us/podcast/the-late-round-fantasy-football-podcast/id1224964045", type: "Free" },
];

const WEBSITES = [
  { name: "Fantasy Footballers", desc: "Expert rankings and high-quality draft/in-season tools.", type: "Premium", url: "https://www.thefantasyfootballers.com" },
  { name: "Fantasy Pros", desc: "Consensus rankings and the MyPlaybook tool suite.", type: "Freemium", url: "https://www.fantasypros.com" },
  { name: "Fantasy Genius", desc: "Advanced league insights and custom Power Rankings.", type: "Free", url: "https://www.fantasygenius.io" },
  { name: "Rotowire", desc: "Real-time news updates and comprehensive stat tracking.", type: "Premium", url: "https://www.rotowire.com/football" },
  { name: "FTN Fantasy", desc: "Proprietary stats and elite betting/fantasy data.", type: "Premium", url: "https://ftnfantasy.com/nfl" },
  { name: "Reddit DynastyFF", desc: "The definitive community for dynasty league discussions.", type: "Free", url: "https://www.reddit.com/r/DynastyFF" },
  { name: "ESPN Fantasy", desc: "Standard league platform with news from the industry's biggest names.", type: "Free", url: "https://www.espn.com/fantasy/football" },
  { name: "CBS Sports", desc: "Expert draft prep and veteran fantasy analysis.", type: "Free", url: "https://www.cbssports.com/fantasy/football" },
  { name: "Yahoo Fantasy", desc: "Classic fantasy platform with deep analytical tools.", type: "Free", url: "https://football.fantasysports.yahoo.com" },
];

const ANALYZERS = [
  { name: "Fantasy Pros Trade", desc: "Syncs your Sleeper league for evaluation.", type: "Freemium", url: "https://www.fantasypros.com/nfl/myplaybook/trade-analyzer.php" },
  { name: "Rotowire Trade", desc: "Deep analytical breakdown of value exchanges.", type: "Premium", url: "https://www.rotowire.com/myleagues/nfl/trade-analyzer.php?id=338093" },
  { name: "FFBallers Trade", desc: "The FootClan's exclusive trade sanity checks.", type: "Premium", url: "https://www.thefantasyfootballers.com/footclan/trade-analyzer/" },
  { name: "KeepTradeCut", desc: "The market standard for dynasty values.", type: "Free", url: "https://keeptradecut.com/trade-calculator" },
  { name: "PFN Analyzer", desc: "Comprehensive trade tool from Pro Football Network.", type: "Free", url: "https://www.profootballnetwork.com/fantasy-football-trade-analyzer" },
  { name: "Fantasy Nerds", desc: "Aggregated trade advice from across the web.", type: "Freemium", url: "https://www.fantasynerds.com/nfl/trades" },
  { name: "Fantasy SP", desc: "Dynamic analyzer using real-time player trends.", type: "Freemium", url: "https://www.fantasysp.com/nfl_trade_analyzer" },
  { name: "FantasyCalc", desc: "Real trade data from thousands of actual leagues.", type: "Free", url: "https://www.fantasycalc.com/trade-calculator" },
  { name: "Reddit Analyzer", desc: "Community-driven trade feedback and discussion.", type: "Free", url: "https://www.reddit.com/r/TradeAnalyzerFF" },
];

export default function ResourcesPage() {
  const [activeTab, setActiveTab] = useState('playlists');

  const ResourceCard = ({ title, desc, url, type }: any) => (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="group bg-white dark:bg-[#1e1e1e] p-5 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] border border-gray-200 dark:border-white/5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full relative overflow-hidden"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight italic pr-12 leading-tight">
          {title}
        </h3>
        {type && (
          <span className={`absolute top-4 right-4 sm:top-6 sm:right-6 text-[8px] sm:text-[9px] font-black uppercase px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full border shadow-xs tracking-widest ${
            type === 'Premium' ? 'bg-orange-500 text-white border-orange-400' : 
            type === 'Freemium' ? 'bg-blue-500 text-white border-blue-400' :
            'bg-emerald-500 text-white border-emerald-400'
          }`}>
            {type}
          </span>
        )}
      </div>
      <p className="text-[10px] sm:text-xs font-bold text-gray-400 dark:text-gray-500 leading-relaxed flex-grow">{desc}</p>
      <div className="mt-4 sm:mt-6 flex items-center gap-2 text-[9px] sm:text-[10px] font-black text-orange-600 dark:text-orange-500 uppercase tracking-[0.2em] group-hover:gap-3 transition-all italic">
        Access Link <ChevronRight className="w-3 h-3" />
      </div>
    </a>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212] transition-colors duration-300 font-sans pb-20 text-gray-900 dark:text-white">
      
      {/* HEADER: Fluid Scale */}
      <div className="bg-white dark:bg-[#1e1e1e] border-b border-gray-200 dark:border-white/5 pb-6 sm:pb-8 pt-4 sticky top-0 z-50 shadow-sm text-center">
          <div className="container mx-auto px-4 relative flex flex-col items-center">
            <Link href="/league-info" className="sm:absolute sm:top-4 sm:left-4 mb-2 sm:mb-0 flex items-center gap-1 text-gray-500 hover:text-orange-600 transition-colors font-bold text-[10px] sm:text-xs uppercase tracking-tight">
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" /> Hub
            </Link>
            <div className="absolute top-4 right-4 z-50 scale-75 sm:scale-100"><ModeToggle /></div>
            <h1 className="mt-2 text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tighter flex items-center justify-center gap-2 sm:gap-3 italic">
                <span className="p-1.5 sm:p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400 shadow-sm"><BookOpen className="w-5 h-5 sm:w-8 sm:h-8" /></span>
                League Resources
            </h1>
          </div>
      </div>

      <main className="container mx-auto px-4 py-8 sm:py-12 max-w-7xl">
        
        {/* TAB NAV: Horizontal Scroll for Mobile */}
        <div className="flex justify-center mb-10 sm:mb-16">
          <div className="flex overflow-x-auto no-scrollbar gap-2 bg-white dark:bg-[#1e1e1e] p-1.5 rounded-full border border-gray-200 dark:border-white/5 shadow-sm max-w-full">
            {[
              { id: 'playlists', icon: Music, label: 'Playlists', color: '#fa233b' },
              { id: 'podcasts', icon: Mic2, label: 'Broadcasts', color: '#ea580c' },
              { id: 'websites', icon: Globe, label: 'Websites', color: '#2563eb' },
              { id: 'analyzers', icon: BarChart3, label: 'Analyzers', color: '#059669' }
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)} 
                className={`whitespace-nowrap px-4 sm:px-8 py-2 sm:py-3 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                  activeTab === tab.id ? 'text-white shadow-lg' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                }`}
                style={{ backgroundColor: activeTab === tab.id ? tab.color : 'transparent' }}
              >
                <tab.icon className="w-3 h-3 sm:w-4 sm:h-4" /> {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* --- DRAFT DAY BROADCAST TAB --- */}
        {activeTab === 'playlists' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8 sm:mb-10 border-l-4 border-[#fa233b] pl-4 sm:pl-6 py-1 sm:py-2">
                <h2 className="text-2xl sm:text-4xl font-black tracking-tighter uppercase italic">Draft Day <span className="text-[#fa233b]">Feed</span></h2>
                <p className="text-[8px] sm:text-[10px] font-black text-[#fa233b] uppercase tracking-[0.3em] mt-1 italic">War Room Frequencies</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-10">
              {BROADCAST_FEED.map((p) => (
                <a key={p.year} href={p.link} target="_blank" className="relative overflow-hidden p-6 sm:p-8 rounded-[2rem] sm:rounded-[3.rem] shadow-lg flex items-center justify-between transition-all duration-500 hover:scale-[1.02] active:scale-95 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-white/5 text-gray-900 dark:text-white">
                  <div className="relative z-10">
                    <span className="text-4xl sm:text-6xl font-black tracking-tighter italic uppercase">{p.year}</span>
                    <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] mt-1 text-[#fa233b]">{p.label}</p>
                  </div>
                  <div className="p-4 sm:p-5 rounded-2xl bg-gray-50 dark:bg-white/5">
                     <Music className="w-8 h-8 sm:w-10 sm:h-10 text-[#fa233b]" />
                  </div>
                  <Radio className="absolute -bottom-6 -right-6 w-32 h-32 opacity-10 rotate-12" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* --- IN-SEASON BROADCASTS TAB --- */}
        {activeTab === 'podcasts' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8 sm:mb-10 border-l-4 border-orange-500 pl-4 sm:pl-6 py-1 sm:py-2">
                <h2 className="text-2xl sm:text-4xl font-black tracking-tighter uppercase italic">Weekly <span className="text-orange-600">Broadcasts</span></h2>
                <p className="text-[8px] sm:text-[10px] font-black text-orange-500 uppercase tracking-[0.3em] mt-1 italic">Analysis</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
              {PODCASTS.map(pod => <ResourceCard key={pod.name} title={pod.name} desc={pod.desc} url={pod.url} type={pod.type} />)}
            </div>
          </div>
        )}

        {/* --- INTELLIGENCE CENTERS TAB --- */}
        {activeTab === 'websites' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8 sm:mb-10 border-l-4 border-blue-500 pl-4 sm:pl-6 py-1 sm:py-2">
                <h2 className="text-2xl sm:text-4xl font-black tracking-tighter uppercase italic">Intelligence <span className="text-blue-600">Centers</span></h2>
                <p className="text-[8px] sm:text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mt-1 italic">Intelligence Gathering</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
              {WEBSITES.map(site => <ResourceCard key={site.name} title={site.name} desc={site.desc} url={site.url} type={site.type} />)}
            </div>
          </div>
        )}

        {/* --- WAR ROOM SIMULATORS TAB --- */}
        {activeTab === 'analyzers' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8 sm:mb-10 border-l-4 border-emerald-500 pl-4 sm:pl-6 py-1 sm:py-2">
                <h2 className="text-2xl sm:text-4xl font-black tracking-tighter uppercase italic">Scenario <span className="text-emerald-600">Analytics</span></h2>
                <p className="text-[8px] sm:text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] mt-1 italic">Trade Simulators</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
              {ANALYZERS.map(tool => <ResourceCard key={tool.name} title={tool.name} desc={tool.desc} url={tool.url} type={tool.type} />)}
            </div>
          </div>
        )}

      </main>
      
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}