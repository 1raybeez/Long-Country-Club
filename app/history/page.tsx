'use client';

import React from 'react';
import Link from 'next/link';

export default function HistoryHub() {
  return (
    <div style={{ backgroundColor: '#F9F7F2', minHeight: '100vh', paddingBottom: '100px' }}>
      
      {/* 1. CLUBHOUSE HEADER */}
      <header style={{ textAlign: 'center', padding: '60px 20px' }}>
        <img 
          src="/Long Country Club FFL.png" 
          alt="LCC Logo" 
          style={{ maxWidth: '350px', width: '100%', marginBottom: '20px' }} 
        />
        <h1 style={{ fontSize: '3rem', fontFamily: 'serif', color: '#1A472A', margin: 0 }}>
          Clubhouse Info Hub
        </h1>
        <p style={{ color: '#C5A059', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px' }}>
          Official Records & League Standards
        </p>

        <nav style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '30px' }}>
          <Link href="/"><button style={navBtnStyle}>Home</button></Link>
          <button style={{ ...navBtnStyle, backgroundColor: '#1A472A', color: 'white' }}>Info Hub</button>
          <button style={navBtnStyle}>Managers</button>
        </nav>
      </header>

      {/* 2. THE CLUBHOUSE TILES (GOLF THEMED) */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '25px'
        }}>
          
          <InfoCard 
            title="The Rules of Play" 
            desc="Official bylaws, scoring metrics, and trade standards of the Club."
            icon="⚖️"
            link="/league-info/constitution"
            btnText="Read Rules"
          />

          <InfoCard 
            title="The Pro Shop" 
            desc="Historical draft boards and active team rosters since the Dynasty transition."
            icon="⛳"
            link="/league-info/draft"
            btnText="View Board"
          />

          <InfoCard 
            title="The Champions Gallery" 
            desc="Hall of Champions (2003-2025) and the Wall of Shame."
            icon="🏆"
            link="/league-info/trophy-room"
            btnText="Enter Hall"
          />

          <InfoCard 
            title="The Locker Room" 
            desc="Helpful resources, manager tools, and league documents."
            icon="📁"
            link="/league-info/resources"
            btnText="Open Files"
          />

          <InfoCard 
            title="Front & Back Nine" 
            desc="Archives of the 2-Keeper Era (2003-2020) and Dynasty Era."
            icon="🗃️"
            link="/league-info/archives"
            btnText="View Archives"
          />

          <InfoCard 
            title="Caddy Fees" 
            desc="League financials, dues tracking, and season prize distributions."
            icon="💰"
            link="/league-info/payouts"
            btnText="Check Vault"
          />

        </div>
      </main>
    </div>
  );
}

// Reusable Tile Component
function InfoCard({ title, desc, icon, link, btnText }: any) {
  return (
    <div style={{
      backgroundColor: 'white',
      padding: '40px',
      borderRadius: '24px',
      textAlign: 'center',
      boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      border: '1px solid #eee'
    }}>
      <div>
        <div style={{ fontSize: '3rem', marginBottom: '15px' }}>{icon}</div>
        <h2 style={{ fontFamily: 'serif', color: '#1A472A', marginBottom: '10px' }}>{title}</h2>
        <p style={{ color: '#666', lineHeight: '1.6', fontSize: '0.95rem', marginBottom: '25px' }}>{desc}</p>
      </div>
      <Link href={link}>
        <button style={{
          backgroundColor: 'transparent',
          color: '#1A472A',
          border: '1px solid #1A472A',
          padding: '10px 25px',
          borderRadius: '20px',
          fontWeight: 'bold',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
        onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#1A472A'; e.currentTarget.style.color = 'white'; }}
        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#1A472A'; }}
        >
          {btnText} →
        </button>
      </Link>
    </div>
  );
}

const navBtnStyle: React.CSSProperties = {
  padding: '10px 25px',
  borderRadius: '30px',
  border: '1px solid #ddd',
  backgroundColor: 'white',
  fontWeight: 'bold',
  cursor: 'pointer',
  fontSize: '0.9rem'
};