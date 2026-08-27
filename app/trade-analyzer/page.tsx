import { redirect } from "next/navigation";
import { getCurrentMemberSession } from "@/lib/auth/session";
import { getOwnerById } from "@/lib/ownerRegistry";
import { getTradeAnalyzerRuntime } from "@/lib/trade-analyzer/tradeAnalyzerRuntime";
import TradeAnalyzerClient, { type TradeAnalyzerCatalogAsset } from "./TradeAnalyzerClient";

export const dynamic = "force-dynamic";

const enabled = (name: string) => process.env[name] === "true";

export default async function TradeAnalyzerPage() {
  const session = await getCurrentMemberSession();
  if (!session?.identity) redirect("/?access=sign-in-required");
  if (!session.member) redirect("/?access=member-required");

  if (!enabled("TRADE_ANALYZER_FEATURE_ENABLED")) {
    return <Unavailable reason="The private Trade Analyzer prototype is currently unavailable." />;
  }
  if (!enabled("TRADE_ANALYZER_PRIVATE_OUTPUT_APPROVED")) {
    return <Unavailable reason="Private market-value output is still under review." />;
  }

  let runtime;
  try {
    runtime = await getTradeAnalyzerRuntime();
  } catch {
    return <Unavailable reason="The approved valuation snapshot is temporarily unavailable." />;
  }
  {
    const catalog: TradeAnalyzerCatalogAsset[] = runtime.catalog.assets.map((asset) => ({
      assetId: asset.assetId,
      displayName: asset.displayName,
      assetType: asset.assetType,
      position: asset.position,
      season: asset.season,
      round: asset.round,
      slot: asset.slot,
      pickKind: asset.pickKind,
      ownerName: asset.ownerId ? getOwnerById(asset.ownerId)?.teamName : undefined,
      marketValue: asset.baseValue,
      valueStatus: asset.valueStatus,
      evidence: asset.evidence,
    }));
    return <TradeAnalyzerClient catalog={catalog} snapshotDate={runtime.snapshot.date} />;
  }
}

function Unavailable({ reason }: { reason: string }) {
  return <main className="lcc2-page-shell"><div className="lcc2-page-container"><section className="lcc2-card lcc2-card--raised max-w-3xl p-6 sm:p-8" aria-labelledby="trade-analyzer-unavailable"><p className="lcc2-label text-[var(--lcc-brand-primary)]">Private Dynasty Operations</p><h1 id="trade-analyzer-unavailable" className="mt-2 font-ui text-4xl font-black tracking-[-0.04em] text-[var(--lcc-color-text)]">Trade Analyzer</h1><p className="lcc2-body mt-4">{reason}</p><p className="lcc2-body mt-2">This private testing surface is not enabled for public use.</p></section></div></main>;
}
