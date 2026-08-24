import { NextResponse } from 'next/server';
import { getCurrentMemberSession } from '@/lib/auth/session';
import { createFeedbackSubmission } from '@/lib/feedbackServer';

export async function POST(request: Request) {
  const session = await getCurrentMemberSession();
  if (!session?.identity) {
    return NextResponse.json({ error: 'Your session has expired. Please sign in again.' }, { status: 401 });
  }
  if (!session.member) {
    return NextResponse.json({ error: 'Your account is not recognized as an active LCC owner.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const result = await createFeedbackSubmission(body, session.member);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to submit feedback.';
    const status = message.includes('authorization') ? 403 : message.includes('storage') ? 503 : message.includes('Invalid feedback') ? 400 : 500;
    return NextResponse.json({ error: status === 500 ? 'Unable to submit feedback right now.' : message }, { status });
  }
}
