import { NextResponse } from 'next/server';
import { reverseAwardSettlement } from '@/lib/finance/corrections';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body || typeof body !== 'object' || Object.keys(body).some((key) => !['season', 'settlementId', 'reason', 'requestId'].includes(key)) || typeof body.season !== 'number' || !Number.isInteger(body.season) || typeof body.settlementId !== 'string' || typeof body.reason !== 'string' || typeof body.requestId !== 'string') return NextResponse.json({ error: 'Invalid award settlement reversal request.' }, { status: 400 });
    const result = await reverseAwardSettlement(body);
    return NextResponse.json(result, { status: result.alreadyExists ? 200 : 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to reverse award settlement.';
    return NextResponse.json({ error: message }, { status: message.includes('authorization') ? 403 : message.includes('storage') ? 503 : 400 });
  }
}
