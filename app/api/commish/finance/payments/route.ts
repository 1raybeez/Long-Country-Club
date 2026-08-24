import { NextResponse } from 'next/server';
import { recordOperationalPayment } from '@/lib/finance/operationalLedger';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await recordOperationalPayment({
      ownerId: body.ownerId,
      amountCents: body.amountCents,
      paymentMethod: body.paymentMethod,
      effectiveDate: body.effectiveDate,
      requestId: body.requestId,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to record payment.';
    const status = message.includes('authorization') ? 403 : message.includes('storage') ? 503 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
