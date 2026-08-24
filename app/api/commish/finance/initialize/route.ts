import { NextResponse } from 'next/server';
import { getCurrentMemberSession } from '@/lib/auth/session';
import { initializeOperationalFinance } from '@/lib/finance/operationalLedger';

export async function POST() {
  const session = await getCurrentMemberSession();
  if (!session?.member?.capabilities.includes('commissioner')) return NextResponse.json({ error: 'Commissioner authorization required.' }, { status: 403 });
  try {
    return NextResponse.json(await initializeOperationalFinance(session.member));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to initialize operational finance.';
    return NextResponse.json({ error: message }, { status: message.includes('unavailable') ? 503 : 400 });
  }
}
