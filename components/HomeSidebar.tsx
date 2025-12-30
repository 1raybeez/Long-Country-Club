// components/HomeSidebar.tsx

import React from 'react';
// ASSUMPTION: getChampionDetails is exported from your sleeper.ts file.
// If it's a default export, change { getChampionDetails } to 'import getChampionDetails from...'
import { getChampionDetails } from '@/lib/sleeper'; // Adjust path to your sleeper.ts

// Since this is fetching data, it is an async Server Component (default in Next.js)
export default async function HomeSidebar() {
  
  // NOTE: You must set your actual league ID in your .env file or hardcode it here.
  const LEAGUE_ID = process.env.SLEEPER_LEAGUE_ID || '896024194098907136'; 
  const SEASON_YEAR = 2024; 

  let champion;
  try {
    // This calls your function to fetch the champion dynamically
    champion = await getChampionDetails(LEAGUE_ID, SEASON_YEAR); 
  } catch (error) {
    console.error("Failed to fetch champion details:", error);
    // Fallback to static data if API call fails
    champion = {
      name: "Jordan Maslyn",
      teamName: "The Shake-n-Bakers",
      avatar: "/managers/Jordan.jpg" 
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