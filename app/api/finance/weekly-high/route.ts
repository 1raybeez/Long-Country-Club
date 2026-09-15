import { NextResponse } from 'next/server';
import { getWeeklyHighBoard } from '@/lib/finance/weeklyHigh';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() { return NextResponse.json(await getWeeklyHighBoard(), { headers: { 'Cache-Control': 'no-store, max-age=0' } }); }
