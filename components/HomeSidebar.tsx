// components/HomeSidebar.tsx

import React from 'react';
import { getChampionDetails } from '@/lib/sleeper';
import { LCC_CURRENT_LEAGUE_ID } from '@/lib/leagueConstants';

const styles = {
  sidebarSection: 'home-sidebar-wrapper rounded-2xl bg-[#1A472A] p-6 text-white shadow-sm',
  champTitle: 'text-[10px] font-black uppercase tracking-[0.3em] text-[#C5A059]',
  reigningChampContainer: 'mt-4 flex flex-col items-center text-center',
  champAvatar: 'h-20 w-20 rounded-full border-4 border-white/20 object-cover',
  champName: 'mt-3 text-2xl font-black uppercase italic',
  champTeam: 'mt-1 text-xs font-bold uppercase text-white/60',
};

// Since this is fetching data, it is an async Server Component (default in Next.js)
export default async function HomeSidebar() {
  
  const leagueId = process.env.SLEEPER_LEAGUE_ID || LCC_CURRENT_LEAGUE_ID;

  let champion;
  try {
    // This calls your function to fetch the champion dynamically
    champion = await getChampionDetails(leagueId);
  } catch (error) {
    console.error("Failed to fetch champion details:", error);
    // Fallback to static data if API call fails
    champion = {
      name: "Tyrone Poist",
      teamName: "LCC Champion",
      avatar: "/managers/Tyrone.png" 
    };
  }
  
  const currentChamp = champion;
  
  return (
    // Uses class names from the home.module.css file
    <>
      <div className={styles.sidebarSection}>
        <h3 className={styles.champTitle}>REIGNING CHAMPION</h3>
        
        <div className={styles.reigningChampContainer}>
          <img src={currentChamp.avatar} alt={currentChamp.name} className={styles.champAvatar} />
          <h2 className={styles.champName}>{currentChamp.name}</h2>
          <p className={styles.champTeam}>{currentChamp.teamName}</p>
        </div>
      </div>
      
      <div className={styles.sidebarSection}>
        <h3 className={styles.champTitle}>RECENT MOVES</h3>
        <p style={{fontSize: '0.8rem', opacity: 0.8}}>Placeholder for live wire activity.</p>
      </div>

      {/* Local styles for HomeSidebar, matching app/page.tsx's styles import */}
      <style jsx global>{`
        .home-sidebar-wrapper h3 { color: white; }
        /* Add other necessary structural styles here if needed */
      `}</style>
    </>
  );
}
