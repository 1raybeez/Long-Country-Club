import { NextResponse } from 'next/server';
import { loadDraftIntelligencePresentation, type DraftGradesLayer } from '@/lib/history/draftIntelligencePresentation';

// The selected Draft Grades layer is query-scoped. Do not cache one layer's
// presentation and reuse it for another layer on the same season route.
export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ season: string }> }) {
  const { season: seasonParam } = await params;
  const season = Number(seasonParam);
  const draftType = new URL(request.url).searchParams.get('draftType') ?? 'rookie';
  const requestedLayer = new URL(request.url).searchParams.get('gradeView');
  const layer: DraftGradesLayer = requestedLayer === 'outcome' || requestedLayer === 'reality' ? requestedLayer : 'draft-day';
  const presentation = Number.isInteger(season) ? loadDraftIntelligencePresentation(season, draftType, layer) : null;
  return NextResponse.json({ available: Boolean(presentation), presentation });
}
