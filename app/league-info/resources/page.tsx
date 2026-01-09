'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, BookOpen, Mic2, Globe, BarChart3, 
  ChevronRight, ExternalLink
} from 'lucide-react';

const PODCASTS = [
  { name: "The Fantasy Footballers", desc: "Award-winning analysis and entertaining start/sit advice.", url: "https://music.apple.com/us/podcast/the-fantasy-footballers-fantasy-football-podcast/id1023761733", type: "Free" },
  { name: "The Ringer Fantasy Show", desc: "High-energy draft strategy and waiver wire deep dives.", url: "https://music.apple.com/us/podcast/the-ringer-fantasy-football-show/id1524039715", type: "Free" },
  { name: "Fantasy Pros Podcast", desc: "Consensus rankings and expert advice hub in audio form.", url: "https://music.apple.com/us/podcast/fantasypros-fantasy-football-podcast/id1138942145", type: "Free" },
  { name: "Establish the Run", desc: "Elite analytics and projections from Evan Silva and Adam Levitan.", url: "https://music.apple.com/us/podcast/establish-the-run-fantasy-football/id1473533244", type: "Free" },
  { name: "The Late-Round Podcast", desc: "JJ Zachariason's data-driven approach to finding sleepers.", url: "https://music.apple.com/us/podcast/the-late-round-fantasy-football-podcast/id1224964045", type: "Free" },
  { name: "Yahoo Fantasy Forecast", desc: "Diverse insights and strategies for all play-styles.", url: "https://music.apple.com/us/podcast/yahoo-fantasy-forecast/id1023761733", type: "Free" }
];

const WEBSITES = [
  { name: "Fantasy Footballers", desc: "Expert rankings and high-quality draft/in-season tools.", type: "Premium", url: "https://www.thefantasyfootballers.com" },
  { name: "Fantasy Pros", desc: "Consensus rankings and the MyPlaybook tool suite.", type: "Freemium", url: "https://www.fantasypros.com" },
  { name: "Rotoballer", desc: "Real-time news and expert start/sit recommendations.", type: "Free", url: "https://www.rotoballer.com" },
  { name: "Sleeper Blog", desc: "Official updates and strategy specifically for the Sleeper platform.", type: "Free", url: "https://blog.sleeper.app" },
  { name: "Draft Sharks", desc: "Award-winning accuracy and personalized draft tools.", type: "Premium", url: "https://www.draftsharks.com" },
  { name: "Fantasy Life", desc: "Quick news alerts and the famous 'Fantasy Life' newsletter tools.", type: "Free", url: "https://www.fantasylife.com" }
];

const ANALYZERS = [
  { name: "Fantasy Pros Trade", desc: "Syncs your Sleeper league for evaluation.", type: "Freemium", url: "https://www.fantasypros.com/nfl/myplaybook/trade-analyzer.php" },
  { name: "KeepTradeCut", desc: "The market standard for dynasty and keeper values.", type: "Free", url: "https://keeptradecut.com/trade-calculator" },
  { name: "WalterPicks", desc: "AI-driven insights and trade evaluation tools.", type: "Free", url: "https://www.walterpicks.com" },
  { name: "FantasyCalc", desc: "Real trade data from thousands of actual leagues.", type: "Free", url: "https://www.fantasycalc.com/trade-calculator" },
  { name: "Trade Navigator", desc: "RotoWire's deep analytical breakdown of value exchanges.", type: "Premium", url: "https://www.rotowire.com/football/trade-analyzer.php" }
];

export default function ResourcesPage() {
  const [activeTab, setActiveTab] = useState('podcasts');

  return (
    <div className="min-h-screen bg-[#F9F7F2] font-serif text-[#1A472A] pb-24">
      
      {/* 1. COUNTRY CLUB HEADER */}
      <header className="py-16 text-center">
        <Link href="/league-info" className="text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-60 transition-opacity">
          ← Back to Clubhouse Hub
        </Link>
        <div className="mt-6 flex flex-col items-center">
          <div className="p-4 bg-white rounded-2xl shadow-sm border border-black/5 mb-4">
            <BookOpen className="w-10 h-10 text-[#C5A059]" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black italic uppercase tracking-tighter leading-none">
            The <span className="text-[#C5A059]">Locker Room</span>
          </h1>
          <p className="mt-4 text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Intelligence & Strategy Hub</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6">
        
        {/* 2. TABBED NAVIGATION */}
        <nav className="flex justify-center mb-16">
          <div className="flex bg-white p-1.5 rounded-full border border-black/5 shadow-sm">
            {[
              { id: 'podcasts', icon: Mic2, label: 'Broadcasts' },
              { id: 'websites', icon: Globe, label: 'Intelligence' },
              { id: 'analyzers', icon: BarChart3, label: 'Analyzers' }
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)} 
                className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                  activeTab === tab.id ? 'bg-[#1A472A] text-white shadow-lg' : 'text-gray-400 hover:text-[#1A472A]'
                }`}
              >
                <tab.icon className="w-3 h-3" /> {tab.label}
              </button>
            ))}
          </div>
        </nav>

        {/* 3. RESOURCE CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {activeTab === 'podcasts' && PODCASTS.map(item => <ResourceCard key={item.name} {...item} />)}
          {activeTab === 'websites' && WEBSITES.map(item => <ResourceCard key={item.name} {...item} />)}
          {activeTab === 'analyzers' && ANALYZERS.map(item => <ResourceCard key={item.name} {...item} />)}
        </div>

      </main>
    </div>
  );
}

// SUB-COMPONENT: COUNTRY CLUB CARD STYLE
function ResourceCard({ name, desc, url, type }: any) {
  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="group bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm hover:shadow-md transition-all flex flex-col h-full text-center items-center justify-between"
    >
      <div className="w-full">
        <div className="flex flex-col items-center mb-4">
          <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-full border tracking-widest mb-4 ${
            type === 'Premium' ? 'bg-[#1A472A] text-white' : 
            type === 'Freemium' ? 'bg-[#C5A059] text-black border-transparent' :
            'bg-[#F9F7F2] text-[#1A472A]'
          }`}>
            {type}
          </span>
          <h3 className="text-xl font-black italic uppercase tracking-tight text-[#1A472A] leading-none mb-4">
            {name}
          </h3>
          <p className="text-xs font-bold text-[#1A472A]/50 leading-relaxed px-2">{desc}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-[9px] font-black text-[#1A472A] uppercase tracking-widest border-b border-[#1A472A] pb-1 group-hover:gap-3 transition-all">
        Open Hub <ExternalLink className="w-3 h-3" />
      </div>
    </a>
  );
}