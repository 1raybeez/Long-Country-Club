import { NextResponse } from 'next/server';
import { settleApprovedAward } from '@/lib/finance/awardSettlement';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const allowed = ['season', 'obligationId', 'method', 'effectiveDate', 'notes', 'requestId'];
    if (!body || typeof body !== 'object' || Object.keys(body).some((key) => !allowed.includes(key)) || typeof body.season !== 'number' || !Number.isInteger(body.season) || typeof body.obligationId !== 'string' || typeof body.method !== 'string' || typeof body.effectiveDate !== 'string' || typeof body.requestId !== 'string' || (body.notes !== undefined && typeof body.notes !== 'string')) return NextResponse.json({ error: 'Invalid award settlement request.' }, { status: 400 });
    const result = await settleApprovedAward({ season: body.season, obligationId: body.obligationId, method: body.method, effectiveDate: body.effectiveDate, requestId: body.requestId, notes: body.notes });
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to record award settlement.';
    const status = message.includes('authorization') ? 403 : message.includes('not found') ? 404 : message.includes('storage') ? 503 : message.includes('already') || message.includes('Only approved') ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
