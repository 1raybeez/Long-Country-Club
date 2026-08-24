import { NextResponse } from 'next/server';
import { getPublicOperationalFinance } from '@/lib/finance/operationalLedger';

export async function GET() {
  try {
    const projection = await getPublicOperationalFinance();
    return NextResponse.json(projection);
  } catch {
    return NextResponse.json({ error: 'Public operational finance is temporarily unavailable.' }, { status: 503 });
  }
}
