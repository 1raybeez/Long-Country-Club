import { NextResponse } from 'next/server';
import { reverseOperationalExpense } from '@/lib/finance/corrections';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body || typeof body !== 'object' || Object.keys(body).some((key) => !['season', 'expenseId', 'reason', 'requestId'].includes(key)) || typeof body.season !== 'number' || !Number.isInteger(body.season) || typeof body.expenseId !== 'string' || typeof body.reason !== 'string' || typeof body.requestId !== 'string') return NextResponse.json({ error: 'Invalid expense reversal request.' }, { status: 400 });
    const result = await reverseOperationalExpense(body);
    return NextResponse.json(result, { status: result.alreadyExists ? 200 : 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to reverse expense.';
    return NextResponse.json({ error: message }, { status: message.includes('authorization') ? 403 : message.includes('storage') ? 503 : 400 });
  }
}
