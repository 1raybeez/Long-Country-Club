'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  DollarSign, ShieldCheck, Landmark, TrendingUp, CheckCircle2, AlertCircle 
} from 'lucide-react';

// DATA SOURCE: Manual Tracker
const WEEKLY_DATA = [
  { wk: 1, name: "Amart", amount: 10 }, { wk: 2, name: "Tyrone", amount: 10 },
  { wk: 3, name: "Ben", amount: 10 }, { wk: 4, name: "Ray", amount: 10 },
  { wk: 5, name: "Tyrone", amount: 10 }, { wk: 6, name: "Ray", amount: 10 },
  { wk: 7, name: "Earl", amount: 10 }, { wk: 8, name: "Tyrone", amount: 10 },
  { wk: 9, name: "Jeffrey", amount: 10 }, { wk: 10, name: "Ray", amount: 10 },
  { wk: 11, name: "Amart", amount: 10 }, { wk: 12, name: "Rob", amount: 10 },
  { wk: 13, name: "Jeffrey", amount: 10 }, { wk: 14, name: "Ben", amount: 10 }
];

// DATA SOURCE: Manual Tracker Payouts
const OWNER_SUMMARY = [
  { name: "Tyrone", highs: 3, place: "1st", won: 299, paid: 50, img: "/managers/Tyrone.png" },
  { name: "Mike M", highs: 0, place: "2nd", won: 100, paid: 50, img: "/managers/Mike M.png" },
  { name: "Ben", highs: 2, place: "3rd", won: 70, paid: 50, img: "/managers/Ben.png" },
  { name: "Ray", highs: 3, place: "4th", won: 55, paid: 50, img: "/managers/Ray.png" },
  { name: "Jeffrey", highs: 2, place: "6th", won: 20, paid: 50, img: "/managers/Jeffrey.png" },
  { name: "Amart", highs: 2, place: "9th", won: 20, paid: 50, img: "/managers/Amart.png" },
  { name: "Earl", highs: 1, place: "5th", won: 10, paid: 10, img: "/managers/EP.png" }, // Partial Credit
  { name: "Rob", highs: 1, place: "7th", won: 10, paid: 50, img: "/managers/Rob.png" },
  { name: "Bill", highs: 0, place: "8th", won: 0, paid: 50, img: "/managers/Bill.png" },
  { name: "Keith", highs: 0, place: "10th", won: 0, paid: 50, img: "/managers/KW.png" },
  { name: "Loren", highs: 0, place: "11th", won: 0, paid: 50, img: "/managers/Loren.png" },
  { name: "Mike E", highs: 0, place: "12th", won: 0, paid: 50, img: "/managers/Mike E.png" },
];

export default function CaddyFees() {
  const duesGoal = 600; 
  const duesCollected = OWNER_SUMMARY.reduce((acc, curr) => acc + curr.paid, 0); // $560

  return (
    <div style={{ backgroundColor: '#F9F7F2', minHeight: '100vh', paddingBottom: '100px', fontFamily: 'Georgia, serif' }}>
      
      <header style={{ textAlign: 'center', padding: '60px 20px 40px' }}>
        <Link href="/league-info" style={{ textDecoration: 'none', color: '#1A472A', fontWeight: 'bold', fontSize: '0.9rem' }}>
          ← Back to Clubhouse Info
        </Link>
        <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 3.5rem)', color: '#1A472A', margin: '20px 0 10px' }}>Caddy Fees</h1>
        <p style={{ color: '#C5A059', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.8rem' }}>
          Official LCC Ledger & 2025 Payouts
        </p>
      </header>

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 20px' }}>
        
        {/* VAULT SECTION */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          <div style={vaultCardStyle('#1A472A')}>
            <DollarSign style={{ color: '#C5A059' }} />
            <h3 style={vaultTitleStyle}>2025 Dues Collected</h3>
            <p style={vaultValueStyle}>${duesCollected}.00</p>
            <span style={vaultSubStyle}>Goal: $600.00 (Earl: $40 Balance)</span>
          </div>
          <div style={vaultCardStyle('#C5A059')}>
            <ShieldCheck style={{ color: '#1A472A' }} />
            <h3 style={{ ...vaultTitleStyle, color: '#1A472A' }}>Dynasty Deposit</h3>
            <p style={{ ...vaultValueStyle, color: '#1A472A' }}>$300.00</p>
            <span style={{ ...vaultSubStyle, color: '#1A472A', opacity: 0.8 }}>Escrow Protection Fund</span>
          </div>
        </div>

        {/* MANAGER VAULT LEDGER */}
        <section style={sectionStyle}>
          <h2 style={sectionHeaderStyle}><Landmark size={20} style={{marginRight: '10px'}}/> The Manager Vault</h2>
          <div style={{ backgroundColor: 'white', borderRadius: '20px', overflow: 'hidden', border: '1px solid #ddd', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#F9F7F2', textAlign: 'left', fontSize: '0.75rem' }}>
                  <th style={tablePadding}>Manager</th>
                  <th style={tablePadding}>Paid Toward Dues</th>
                  <th style={tablePadding}>Highs</th>
                  <th style={tablePadding}>Finish</th>
                  <th style={{...tablePadding, color: '#1A472A'}}>Total Won</th>
                  <th style={tablePadding}>Status</th>
                </tr>
              </thead>
              <tbody>
                {OWNER_SUMMARY.sort((a,b) => b.won - a.won).map(o => (
                  <tr key={o.name} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={tablePadding}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src={o.img} style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }} onError={(e:any)=>e.target.src='/logo.png'} />
                        <strong>{o.name}</strong>
                      </div>
                    </td>
                    <td style={tablePadding}>${o.paid}.00</td>
                    <td style={tablePadding}>{o.highs}</td>
                    <td style={tablePadding}>{o.place}</td>
                    <td style={{...tablePadding, color: '#1A472A', fontWeight: 'bold'}}>${o.won}.00</td>
                    <td style={tablePadding}>
                      <span style={statusBadgeStyle(o.paid === 50, o.name === 'Earl')}>
                        {o.paid === 50 ? 'PAID' : o.name === 'Earl' ? 'PARTIAL' : 'UNPAID'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* WEEKLY WINNERS LEDGER */}
        <section style={sectionStyle}>
          <h2 style={sectionHeaderStyle}><TrendingUp size={20} style={{marginRight: '10px'}}/> Weekly High Scorers ($10/wk)</h2>
          <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '20px', border: '1px solid #ddd' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #F9F7F2', textAlign: 'left', fontSize: '0.8rem', color: '#999' }}>
                  <th style={{ padding: '10px' }}>WEEK</th>
                  <th style={{ padding: '10px' }}>OWNER</th>
                  <th style={{ padding: '10px' }}>PAYOUT</th>
                </tr>
              </thead>
              <tbody>
                {WEEKLY_DATA.map(w => (
                  <tr key={w.wk} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px', fontSize: '0.9rem' }}>Week {w.wk}</td>
                    <td style={{ padding: '10px', fontWeight: 'bold' }}>{w.name}</td>
                    <td style={{ padding: '10px', color: '#1A472A', fontWeight: 'bold' }}>
                        {w.name === 'Earl' ? '$0.00 (Credit Applied)' : '$10.00'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </main>
    </div>
  );
}

// STYLES
const vaultCardStyle = (bg: string) => ({ backgroundColor: bg, padding: '30px', borderRadius: '25px', color: 'white', textAlign: 'center' as const });
const vaultTitleStyle = { margin: '10px 0 5px', fontSize: '0.9rem', textTransform: 'uppercase' as const, letterSpacing: '1px' };
const vaultValueStyle = { fontSize: '2.5rem', fontWeight: '900', margin: '0' };
const vaultSubStyle = { fontSize: '0.75rem', opacity: 0.6, fontWeight: 'bold' };
const sectionStyle = { marginBottom: '50px' };
const sectionHeaderStyle = { display: 'flex', alignItems: 'center', color: '#1A472A', borderBottom: '2px solid #C5A059', paddingBottom: '10px', marginBottom: '20px', fontSize: '1.2rem' };
const tablePadding = { padding: '15px' };
const statusBadgeStyle = (paid: boolean, partial: boolean) => ({
  fontSize: '0.6rem', fontWeight: 'bold', padding: '4px 10px', borderRadius: '10px',
  backgroundColor: paid ? '#E6F4EA' : partial ? '#FFF4E5' : '#FCE8E6', 
  color: paid ? '#1A472A' : partial ? '#C05621' : '#d32f2f',
  border: `1px solid ${paid ? '#1A472A' : partial ? '#C05621' : '#d32f2f'}`
});