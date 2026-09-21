import { notFound } from "next/navigation";
import { NflWeekScoreboard } from "@/app/NflWeekScoreboard";
import { loadNflScoreboard } from "@/lib/nflScoreboard";

type NflWeekPageProps = { params: Promise<{ week: string }> };

export default async function NflWeekPage({ params }: NflWeekPageProps) {
  const { week: rawWeek } = await params;
  const week = Number(rawWeek);
  if (!Number.isInteger(week) || week < 1 || week > 25) notFound();
  return <NflWeekScoreboard week={week} initialScoreboard={await loadNflScoreboard(null, week)} />;
}
