import { NextResponse } from 'next/server';
import { transitionWeeklyAward } from '@/lib/finance/awardWorkflow';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body || typeof body !== 'object' || Object.keys(body).some((key) => !['season', 'obligationId', 'reason'].includes(key)) || typeof body.season !== 'number' || !Number.isInteger(body.season) || typeof body.obligationId !== 'string' || typeof body.reason !== 'string') return NextResponse.json({ error: 'Only integer season, obligationId, and reason are accepted.' }, { status: 400 });
    const result = await transitionWeeklyAward({ season: body.season, obligationId: body.obligationId, action: 'reject', reason: body.reason });
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to reject award.';
    const status = message.includes('authorization') ? 403 : message.includes('not found') ? 404 : message.includes('storage') ? 503 : message.includes('already') || message.includes('invalid') ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
