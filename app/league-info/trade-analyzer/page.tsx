import { LeagueInfoShell } from "@/components/league/LeagueInfoShell";
import TradeAnalyzerPage from "@/app/trade-analyzer/page";

export const dynamic = "force-dynamic";

export default function LeagueInfoTradeAnalyzerPage() {
  return <LeagueInfoShell><TradeAnalyzerPage /></LeagueInfoShell>;
}
