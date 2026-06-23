'use client';

import React from 'react';
import Link from 'next/link';
import { LCC_LEAGUE_INFO_CARD_ROUTES } from '@/lib/routeConfig';

const INFO_CARDS = LCC_LEAGUE_INFO_CARD_ROUTES.map((route) => ({
  title: route.label.toUpperCase(),
  icon: route.icon,
  link: route.href,
}));

export default function ClubhouseInfoPage() {
  return (
    <main className="max-w-7xl mx-auto px-6 pt-12 pb-24 font-serif text-[#1A472A]">
      <div className="text-center mb-16">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 opacity-40">
          Clubhouse Info Hub
        </p>
        <h2 className="text-2xl font-black italic uppercase tracking-[0.2em] border-b-2 border-[#1A472A] inline-block px-12 pb-2">
          Official Records
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {INFO_CARDS.map((card, idx) => (
          <div key={idx} className="bg-white rounded-[2.5rem] p-12 shadow-sm border border-black/5 text-center flex flex-col items-center justify-center space-y-8 hover:shadow-md transition-all hover:scale-[1.01]">
            <div className="text-4xl w-24 h-24 bg-[#F9F7F2] rounded-full flex items-center justify-center border border-black/5 shadow-inner">
              {card.icon}
            </div>
            <h3 className="text-xl font-black italic uppercase tracking-tight leading-none">
              {card.title}
            </h3>
            <Link href={card.link}>
              <button className="px-10 py-3 rounded-full border-2 border-[#1A472A] text-[10px] font-black uppercase tracking-widest hover:bg-[#1A472A] hover:text-white transition-all">
                View Hub →
              </button>
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}
