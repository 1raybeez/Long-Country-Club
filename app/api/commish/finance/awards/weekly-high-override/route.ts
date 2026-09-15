import { NextResponse } from 'next/server';
import { revertWeeklyHighOverride, saveWeeklyHighOverride } from '@/lib/finance/weeklyHigh';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body?.action === 'revert' && typeof body.season === 'number' && typeof body.week === 'number') return NextResponse.json(await revertWeeklyHighOverride(body.season, body.week));
    if (!body || typeof body.season !== 'number' || typeof body.week !== 'number' || typeof body.franchiseId !== 'string' || typeof body.score !== 'number') return NextResponse.json({ error: 'Invalid weekly-high override request.' }, { status: 400 });
    return NextResponse.json(await saveWeeklyHighOverride(body), { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to update weekly-high override.';
    return NextResponse.json({ error: message }, { status: message.includes('authorization') ? 403 : message.includes('storage') ? 503 : 400 });
  }
}
