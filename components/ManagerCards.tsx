// components/ManagerCards.tsx

'use client'; // 👈 THIS IS THE CRITICAL FIX: It allows local styling and interactivity

import React from 'react';

// 1. DATA INTERFACE (Keep this here for type safety)
interface ManagerData {
  userId: string;
  name: string;
  coOwners?: string[];
  roles?: string[];
  championships: number;
  location: string;
  bio: string;
  photo: string;
  favoriteTeam: string;
  mode: string;
  rival: { name: string; userId: string; } | null;
  tradingScale: number;
  preferredContact: string;
  phone: string;
  currentWinnings: number;
}

// 2. LEAGUE DATA (Paste your full array here)
const MANAGER_METADATA: ManagerData[] = [
  // Full 12 entries here
  { userId: "342828350391230464", name: "Ray", coOwners: ["Jeffrey Hudgins"], roles: ["Commissioner"], championships: 0, location: "Richmond", bio: "Greatest Commish Ever (self-proclaimed)...", photo: "/managers/Ray.png", favoriteTeam: "atl", mode: "Rebuild", rival: { name: "Wade", userId: "342838548870762496" }, tradingScale: 8, preferredContact: "Text", phone: "8046471100", currentWinnings: 0 },
  { userId: "342850391018356736", name: "JD", championships: 1, location: "Richmond", bio: "Husband, Father, Architect, Artist, DJ...", photo: "/managers/JD.png", favoriteTeam: "nyj", mode: "Win Now", rival: { name: "Tommy", userId: "342849293037608960" }, tradingScale: 5, preferredContact: "Sleeper", phone: "9174821170", currentWinnings: 30 },
  // ... rest of the managers
];

// Helper to determine accent color
const getAccentColor = (manager: ManagerData) => {
  if (manager.championships > 0) return 'gold';
  if (manager.mode === 'Rebuild') return 'blue';
  return 'green';
};

// 3. PAGE COMPONENT (Now a Client Component)
export default function ManagerCards() {
  return (
    <>
      <div className="owners-header">
        <h2>The Owners</h2>
        <p>The heroes, villains, and champions of River City FFL.</p>
      </div>

      <div className="owners-grid">
        {MANAGER_METADATA.map((manager) => {
          const accentClass = getAccentColor(manager);
          const isChamp = manager.championships > 0;
          const tradeFillClass = accentClass === 'gold' ? 'green' : accentClass;

          return (
            <article key={manager.userId} className={`owner-card accent-${accentClass}`}>
              
              {/* Card content structure remains the same */}
              <div className="card-top-stats">
                <span className="paid-badge">Paid <i className="fas fa-check-circle"></i></span>
                <div className="record-box">
                  <div className="winnings">
                    <span>2025 Winnings</span>
                    <span className={`money ${manager.currentWinnings > 0 ? 'green' : ''}`}>
                      ${manager.currentWinnings}
                    </span>
                  </div>
                </div>
              </div>

              <div className="owner-identity">
                <img src={manager.photo} alt={manager.name} className="owner-avatar" />
                <div className="name-loc">
                  <h3>{manager.name}</h3>
                  <p><i className="fas fa-map-marker-alt"></i> {manager.location}</p>
                  {manager.coOwners && (<p className="co-owner-name">w/ {manager.coOwners.join(', ')}</p>)}
                </div>
              </div>

              <div className="achievements-bar">
                <div className={`achievement-pill ${isChamp ? 'gold' : 'generic'}`}>
                    <i className={`fas ${isChamp ? 'fa-trophy' : 'fa-search'}`}></i> {isChamp ? `${manager.championships}X CHAMP` : 'Quest for the Ring'}
                </div>
                {manager.roles && manager.roles.includes("Commissioner") && (
                    <div className="achievement-pill generic commish-role"><i className="fas fa-gavel"></i> Commish</div>
                )}
              </div>

              <div className="status-container">
                <div className="status-box">
                  <span className="label">Mode</span>
                  <span className={`value ${manager.mode === 'Win Now' ? 'green' : ''}`}>{manager.mode}</span>
                </div>
                <div className="status-box trade-box">
                  <span className="label">Trade Interest</span>
                  <div className="progress-bar">
                    <div className={`fill ${tradeFillClass}`} style={{ width: `${manager.tradingScale * 10}%` }}></div>
                  </div>
                </div>
              </div>

              {manager.rival && (
                  <div className="nemesis-container">
                    <span className="nemesis-label"><i className="fas fa-times text-red"></i> NEMESIS</span>
                    <div className="nemesis-info"><span>{manager.rival.name}</span></div>
                  </div>
              )}

              <div className="owner-quote">
                <i className="fas fa-quote-left"></i>
                <p>"{manager.bio}"</p>
              </div>

            </article>
          );
        })}
      </div>
      
      {/* 4. LOCAL CSS (The safe way using styled-jsx in a client component) */}
      <style jsx>{`
        .owners-header { color: var(--mgr-text-primary); text-align: center; margin-bottom: 3rem; }
        .owners-header h2 { font-size: 2.5rem; font-weight: 700; color: var(--mgr-text-primary); margin: 0 0 0.5rem 0; }
        .owners-header p { color: var(--mgr-text-secondary); margin: 0; font-size: 1.1rem; }

        .owners-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 2rem;
            max-width: 1400px;
            margin: 0 auto;
        }

        /* Card Variables (Local to this file) */
        .owners-grid {
            --mgr-bg-main: #0f111a;
            --mgr-bg-card: #151b2b;
            --mgr-bg-inner: #1c2333;
            --mgr-text-primary: #ffffff;
            --mgr-text-secondary: #94a3b8;
            --mgr-accent-green: #10b981;
            --mgr-accent-red: #ef4444;
            --mgr-accent-blue: #3b82f6;
            --mgr-accent-gold: #fbbf24;
            --mgr-border: #334155;
        }

        .owner-card {
            background-color: var(--mgr-bg-card);
            border-radius: 16px;
            padding: 1.5rem;
            position: relative;
            display: flex;
            flex-direction: column;
            gap: 1.2rem;
            border: 1px solid rgba(255, 255, 255, 0.05);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            color: var(--mgr-text-primary);
            transition: transform 0.2s ease;
        }
        .owner-card:hover { transform: translateY(-5px); }

        .owner-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 6px; background: var(--mgr-accent-green); }
        .owner-card.accent-green::before { background: var(--mgr-accent-green); box-shadow: 0 0 20px var(--mgr-accent-green); }
        .owner-card.accent-red::before { background: var(--mgr-accent-red); box-shadow: 0 0 20px var(--mgr-accent-red); }
        .owner-card.accent-blue::before { background: var(--mgr-accent-blue); box-shadow: 0 0 20px var(--mgr-accent-blue); }
        .owner-card.accent-gold::before { background: var(--mgr-accent-gold); box-shadow: 0 0 20px var(--mgr-accent-gold); }

        .paid-badge { background-color: rgba(16, 185, 129, 0.2); color: var(--mgr-accent-green); font-size: 0.75rem; font-weight: 700; padding: 4px 10px; border-radius: 20px; height: fit-content; display: flex; align-items: center; gap: 5px; }
        .winnings { display: flex; flex-direction: column; align-items: flex-end; }
        .winnings span:first-child { font-size: 0.7rem; color: var(--mgr-text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
        .money { font-weight: 700; font-size: 1.1rem; color: var(--mgr-text-primary); }
        .money.green { color: var(--mgr-accent-green); }

        .owner-identity { display: flex; gap: 15px; align-items: center; }
        .owner-avatar { width: 64px; height: 64px; border-radius: 12px; object-fit: cover; border: 2px solid var(--mgr-bg-inner); }
        .name-loc h3 { margin: 0; font-size: 1.25rem; font-weight: 700; color: var(--mgr-text-primary); }
        .name-loc p { margin: 2px 0 0 0; font-size: 0.85rem; color: var(--mgr-text-secondary); }
        .co-owner-name { font-size: 0.8rem; opacity: 0.8; margin-top: 2px; color: var(--mgr-text-secondary); }

        .achievements-bar { display: flex; flex-wrap: wrap; gap: 8px; }
        .achievement-pill { padding: 8px 12px; border-radius: 8px; font-size: 0.8rem; font-weight: 700; display: flex; gap: 6px; align-items: center; }
        .achievement-pill.gold { background-color: rgba(251, 191, 36, 0.1); color: var(--mgr-accent-gold); border: 1px solid rgba(251, 191, 36, 0.2); }
        .achievement-pill.generic { background-color: var(--mgr-bg-inner); color: var(--mgr-text-secondary); border: 1px solid var(--mgr-border); }
        .fa-faded { opacity: 0.6; }
        .commish-role { border: 1px solid var(--mgr-accent-blue); color: var(--mgr-accent-blue); background-color: rgba(59, 130, 246, 0.1); }

        .status-container { display: flex; gap: 10px; }
        .status-box { flex: 1; background-color: var(--mgr-bg-inner); padding: 12px; border-radius: 8px; border: 1px solid var(--mgr-border); }
        .status-box .label { display: block; font-size: 0.65rem; color: var(--mgr-text-secondary); margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px; }
        .status-box .value { font-weight: 700; font-size: 0.95rem; }
        .status-box .value.green { color: var(--mgr-accent-green); }

        .progress-bar { height: 6px; background-color: #334155; border-radius: 3px; width: 100%; margin-top: 5px; overflow: hidden; }
        .progress-bar .fill { height: 100%; border-radius: 3px; }
        .fill.green { background-color: var(--mgr-accent-green); }
        .fill.blue { background-color: var(--mgr-accent-blue); }
        .fill.red { background-color: var(--mgr-accent-red); }
        .fill.gold { background-color: var(--mgr-accent-gold); }

        .nemesis-container {
          background-color: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 8px; padding: 10px 15px; display: flex; justify-content: space-between; align-items: center;
        }
        .nemesis-label { font-size: 0.75rem; color: var(--mgr-accent-red); font-weight: 700; display: flex; align-items: center; gap: 6px; }
        .nemesis-info { font-size: 0.9rem; font-weight: 700; color: var(--mgr-text-primary); }

        .owner-quote { margin-top: auto; font-style: italic; font-size: 0.85rem; color: var(--mgr-text-secondary); opacity: 0.7; position: relative; padding-left: 20px; }
        .owner-quote .fa-quote-left { position: absolute; left: 0; top: 0; font-size: 0.8rem; opacity: 0.5; }
        .text-red { color: var(--mgr-accent-red); }
      `}</style>
    </>
  );
}