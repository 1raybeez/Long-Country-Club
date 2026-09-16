import { NextResponse } from 'next/server';
import { applyAwardToLeagueFees } from '@/lib/finance/awardSettlement';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body || typeof body.season !== 'number' || typeof body.obligationId !== 'string' || typeof body.requestId !== 'string' || (body.notes !== undefined && typeof body.notes !== 'string')) return NextResponse.json({ error: 'Invalid award credit request.' }, { status: 400 });
    return NextResponse.json(await applyAwardToLeagueFees(body));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to apply award credit.';
    return NextResponse.json({ error: message }, { status: message.includes('authorization') ? 403 : message.includes('storage') ? 503 : 400 });
  }
}
