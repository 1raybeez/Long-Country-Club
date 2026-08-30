import { redirect } from "next/navigation";
import { getCurrentMemberSession } from "@/lib/auth/session";
import { getOwnerById } from "@/lib/ownerRegistry";
import { ACTIVE_LCC_OWNERS } from "@/lib/lccOwners";
import { getOwnerImagePath } from "@/lib/ownerImages";
import { getWarRoomCurrentRoster } from "@/lib/warRoom/currentRoster";
import { getWarRoomDraftCapital } from "@/lib/warRoom/draftCapital";
import { getTradeAnalyzerRuntime } from "@/lib/trade-analyzer/tradeAnalyzerRuntime";
import TradeAnalyzerParticipantClient, { type TradeAnalyzerCatalogAsset } from "./TradeAnalyzerParticipantClient";

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
    const playerImages = new Map(ACTIVE_LCC_OWNERS.flatMap((owner) => (getWarRoomCurrentRoster(owner.id)?.players ?? []).map((player) => [player.id, { imageUrl: player.imageUrl, teamName: player.teamName ?? player.team, status: player.status }] as const)));
    const catalog: TradeAnalyzerCatalogAsset[] = runtime.catalog.assets.map((asset) => ({
      assetId: asset.assetId,
      displayName: asset.displayName,
      assetType: asset.assetType,
      position: asset.position,
      season: asset.season,
      round: asset.round,
      slot: asset.slot,
      pickKind: asset.pickKind,
      ownerId: asset.ownerId,
      ownerName: asset.ownerId ? getOwnerById(asset.ownerId)?.teamName : undefined,
      marketValue: asset.baseValue,
      valueStatus: asset.valueStatus,
      evidence: asset.evidence,
      imageUrl: asset.assetType === "PLAYER" || asset.assetType === "K" || asset.assetType === "DST" ? playerImages.get(asset.assetId)?.imageUrl ?? undefined : undefined,
      nflTeam: playerImages.get(asset.assetId)?.teamName ?? undefined,
      rosterStatus: playerImages.get(asset.assetId)?.status,
    }));
    const sandboxCatalog: TradeAnalyzerCatalogAsset[] = buildSandboxCatalog(catalog);
    const teams = ACTIVE_LCC_OWNERS.map((owner) => ({
      ownerId: owner.id,
      teamName: getOwnerById(owner.id)?.teamName ?? owner.displayName,
      ownerName: owner.displayName,
      imageUrl: getOwnerImagePath(owner.id),
      draftCapital: getWarRoomDraftCapital(owner.id)?.picks ?? [],
    }));
    return <TradeAnalyzerParticipantClient catalog={catalog} sandboxCatalog={sandboxCatalog} teams={teams} snapshotDate={runtime.snapshot.date} />;
  }
}

function buildSandboxCatalog(catalog: TradeAnalyzerCatalogAsset[]): TradeAnalyzerCatalogAsset[] {
  const players = catalog.filter((asset) => asset.assetType !== "PICK").map((asset) => ({ ...asset, ownerId: undefined, ownerName: undefined }));
  const genericPicks = new Map<string, TradeAnalyzerCatalogAsset>();
  for (const asset of catalog) {
    if (asset.assetType !== "PICK" || asset.pickKind !== "GENERIC_ROUND" || asset.season === undefined || asset.round === undefined || genericPicks.has(`${asset.season}-${asset.round}`)) continue;
    const suffix = asset.round === 1 ? "st" : asset.round === 2 ? "nd" : asset.round === 3 ? "rd" : "th";
    genericPicks.set(`${asset.season}-${asset.round}`, { ...asset, assetId: `sandbox-pick-${asset.season}-${asset.round}`, displayName: `${asset.season} ${asset.round}${suffix}`, ownerId: undefined, ownerName: undefined, slot: undefined, pickKind: "GENERIC_ROUND" });
  }
  return [...players, ...genericPicks.values()];
}

function Unavailable({ reason }: { reason: string }) {
  return <main className="lcc2-page-shell"><div className="lcc2-page-container"><section className="lcc2-card lcc2-card--raised max-w-3xl p-6 sm:p-8" aria-labelledby="trade-analyzer-unavailable"><p className="lcc2-label text-[var(--lcc-brand-primary)]">Private Dynasty Operations</p><h1 id="trade-analyzer-unavailable" className="mt-2 font-ui text-4xl font-black tracking-[-0.04em] text-[var(--lcc-color-text)] sm:text-5xl">Trade Analyzer</h1><p className="lcc2-body mt-4">{reason}</p><p className="lcc2-body mt-2">Available only to authenticated active LCC league members.</p></section></div></main>;
}
