import type { Metadata } from 'next';
import { LeagueInfoShell } from '@/components/league/LeagueInfoShell';
import { RookieDraftRecap } from '@/components/drafts/RookieDraftRecap';

export const metadata: Metadata = {
  title: '2026 Rookie Draft Recap | Long Country Club FFL',
  description: '2026 LCC dynasty rookie draft grades, values, reaches, awards, and team report cards.',
};

export default function RookieDraftRecapPage() {
  return <LeagueInfoShell><RookieDraftRecap /></LeagueInfoShell>;
}
