import { NextResponse } from 'next/server';
import { getCurrentMemberSession } from '@/lib/auth/session';
import { updateCommissionerFeedback } from '@/lib/feedbackServer';

export async function PATCH(request: Request) {
  const session = await getCurrentMemberSession();
  if (!session?.member?.capabilities.includes('commissioner')) {
    return NextResponse.json({ error: 'Commissioner authorization required.' }, { status: 403 });
  }

  try {
    const body = await request.json() as { feedbackId?: unknown; status?: unknown; commissionerNote?: unknown };
    if (typeof body.feedbackId !== 'string') return NextResponse.json({ error: 'Feedback ID is required.' }, { status: 400 });
    const { feedbackId, ...update } = body;
    return NextResponse.json(await updateCommissionerFeedback(feedbackId, update));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to update feedback.';
    const status = message.includes('authorization') ? 403 : message.includes('not found') ? 404 : message.includes('storage') ? 503 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
