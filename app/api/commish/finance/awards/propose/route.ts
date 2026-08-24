import { NextResponse } from 'next/server';
import { proposePostseasonAward, proposeWeeklyHighAward } from '@/lib/finance/awardProposals';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body || typeof body !== 'object' || typeof body.season !== 'number' || !Number.isInteger(body.season) || (body.category === undefined && (typeof body.week !== 'number' || !Number.isInteger(body.week))) || (body.category !== undefined && typeof body.category !== 'string') || Object.keys(body).some((key) => !['season', 'week', 'category'].includes(key))) return NextResponse.json({ error: 'Invalid award proposal request.' }, { status: 400 });
    const result = typeof body.category === 'string' ? await proposePostseasonAward({ season: body.season, category: body.category as 'fourth-place' | 'third-place' | 'runner-up' | 'champion' }) : await proposeWeeklyHighAward({ season: body.season, week: body.week });
    return NextResponse.json(result, { status: result.alreadyExists ? 200 : 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to propose weekly award.';
    const status = message.includes('authorization') ? 403 : message.includes('storage') ? 503 : message.includes('already exists') ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
