import { NextResponse } from 'next/server';
import { reverseDuesPayment } from '@/lib/finance/corrections';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body || typeof body !== 'object' || Object.keys(body).some((key) => !['season', 'paymentId', 'reason', 'requestId'].includes(key)) || typeof body.season !== 'number' || !Number.isInteger(body.season) || typeof body.paymentId !== 'string' || typeof body.reason !== 'string' || typeof body.requestId !== 'string') return NextResponse.json({ error: 'Invalid dues payment reversal request.' }, { status: 400 });
    const result = await reverseDuesPayment(body);
    return NextResponse.json(result, { status: result.alreadyExists ? 200 : 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to reverse dues payment.';
    return NextResponse.json({ error: message }, { status: message.includes('authorization') ? 403 : message.includes('storage') ? 503 : 400 });
  }
}
