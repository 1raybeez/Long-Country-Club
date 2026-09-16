import { NextResponse } from 'next/server';
import { clearPaymentArrangement, setPaymentArrangement } from '@/lib/finance/paymentArrangements';

export async function POST(request: Request) {
  try { const body = await request.json(); if (body?.action === 'clear') return NextResponse.json(await clearPaymentArrangement(body.season, body.ownerId)); return NextResponse.json(await setPaymentArrangement(body)); }
  catch (error) { const message = error instanceof Error ? error.message : 'Unable to update payment arrangement.'; return NextResponse.json({ error: message }, { status: message.includes('authorization') ? 403 : 400 }); }
}
