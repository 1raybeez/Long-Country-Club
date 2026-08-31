"use client";

import { useMemo, useState } from "react";
import type { TradeAnalyzerCatalogAsset, TradeAnalyzerTeam } from "./TradeAnalyzerParticipantClient";

type Participant = { franchiseId: string; assets: string[]; destinations: Record<string, string> };
const positions = ["QB", "RB", "WR", "TE", "K", "DST"];
const money = (value: number) => value >= 1000 ? `${(value / 1000).toFixed(1)}K` : Math.round(value).toLocaleString();

export default function CompactMultiParticipantColumn({ index, participant, participants, labels, teams, catalog, selected, onTeamChange, onToggle, onDestination }: {
  index: number;
  participant: Participant;
  participants: Participant[];
  labels: string[];
  teams: TradeAnalyzerTeam[];
  catalog: TradeAnalyzerCatalogAsset[];
  selected: Set<string>;
  onTeamChange: (index: number, id: string) => void;
  onToggle: (index: number, id: string) => void;
  onDestination: (index: number, id: string, destination: string) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState("ALL");
  const owned = useMemo(() => catalog.filter((asset) => asset.ownerId === participant.franchiseId), [catalog, participant.franchiseId]);
  const availableDestinations = participants.map((candidate, candidateIndex) => ({ label: labels[candidateIndex], id: candidate.franchiseId })).filter((candidate, candidateIndex) => candidateIndex !== index && candidate.id);
  const selectedAssets = participant.assets.map((assetId) => catalog.find((asset) => asset.assetId === assetId)).filter((asset): asset is TradeAnalyzerCatalogAsset => Boolean(asset));
  const matches = owned.filter((asset) => !selected.has(asset.assetId) && (position === "ALL" || asset.position === position || (position === "DST" && asset.assetType === "DST")) && (!query.trim() || `${asset.displayName} ${asset.position ?? ""} ${asset.nflTeam ?? ""}`.toLowerCase().includes(query.trim().toLowerCase()))).slice(0, 40);

  return <article className="lcc2-card lcc2-card--raised min-w-0 p-4 sm:p-5">
    <p className="lcc2-label">Participant {index + 1}</p>
    <select aria-label={`Participant ${index + 1} franchise`} value={participant.franchiseId} onChange={(event) => onTeamChange(index, event.target.value)} className="lcc2-input"><option value="">Choose a franchise</option>{teams.map((team) => <option key={team.ownerId} value={team.ownerId} disabled={participants.some((candidate, candidateIndex) => candidateIndex !== index && candidate.franchiseId === team.ownerId)}>{team.teamName}</option>)}</select>
    {participant.franchiseId ? <>
      <div className="mt-4 rounded-lg border border-[var(--lcc-color-border)] p-3">
        <div className="flex items-center justify-between gap-2"><p className="lcc2-label">Sending · {participant.assets.length}/15</p><button type="button" onClick={() => setPickerOpen((open) => !open)} className="lcc2-button lcc2-button--secondary px-2 py-1 text-xs">{pickerOpen ? "Close picker" : "+ Add Asset"}</button></div>
        {selectedAssets.length ? <ul className="mt-2 space-y-2">{selectedAssets.map((asset) => <li key={asset.assetId} className="rounded-lg border border-[var(--lcc-brand-primary)] bg-[var(--lcc-gold-soft)] p-2"><div className="flex items-start justify-between gap-2"><span className="min-w-0 font-ui text-sm font-bold text-[var(--lcc-color-text)]">{asset.displayName} <span className="font-normal text-[var(--lcc-color-text-muted)]">{asset.position ?? asset.assetType}{asset.nflTeam ? ` · ${asset.nflTeam}` : ""}{asset.marketValue !== undefined ? ` · ${money(asset.marketValue)}` : ""}</span></span><button type="button" onClick={() => onToggle(index, asset.assetId)} aria-label={`Remove ${asset.displayName} from Participant ${index + 1}`} className="lcc2-button lcc2-button--secondary shrink-0 px-2 py-1 text-xs">Remove</button></div><label className="mt-2 grid gap-1"><span className="lcc2-label">Destination</span><select aria-label={`${asset.displayName} destination`} value={participant.destinations[asset.assetId] ?? ""} onChange={(event) => onDestination(index, asset.assetId, event.target.value)} className="lcc2-input"><option value="">Choose destination</option>{availableDestinations.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.label}</option>)}</select></label></li>)}</ul> : <p className="lcc2-body mt-2 text-sm">No outgoing assets selected.</p>}
      </div>
      {pickerOpen ? <div className="mt-3 rounded-lg border border-[var(--lcc-color-border-strong)] p-3"><div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]"><label className="grid gap-1"><span className="lcc2-label">Search roster and picks</span><input aria-label={`Search assets for Participant ${index + 1}`} value={query} onChange={(event) => setQuery(event.target.value)} className="lcc2-input" placeholder="Search by player or pick" /></label><label className="grid gap-1"><span className="lcc2-label">Position</span><select aria-label={`Filter assets for Participant ${index + 1}`} value={position} onChange={(event) => setPosition(event.target.value)} className="lcc2-input"><option value="ALL">All</option>{positions.map((item) => <option key={item} value={item}>{item}</option>)}</select></label></div><div className="mt-3 grid max-h-64 gap-2 overflow-y-auto pr-1">{matches.map((asset) => <div key={asset.assetId} className="flex min-w-0 items-center gap-2 rounded-lg border border-[var(--lcc-color-border)] p-2"><span className="min-w-0 flex-1 truncate text-sm font-bold text-[var(--lcc-color-text)]">{asset.displayName} <span className="font-normal text-[var(--lcc-color-text-muted)]">{asset.position ?? asset.assetType}{asset.marketValue !== undefined ? ` · ${money(asset.marketValue)}` : ""}</span></span><button type="button" onClick={() => { onToggle(index, asset.assetId); setQuery(""); }} className="lcc2-button lcc2-button--secondary shrink-0 px-2 py-1 text-xs">Select</button></div>)}{!matches.length ? <p className="lcc2-body text-sm">No matching available assets.</p> : null}</div><p className="mt-2 text-xs text-[var(--lcc-color-text-muted)]">Showing up to 40 matching assets.</p></div> : null}
    </> : <p className="lcc2-body mt-4">Choose a franchise to view its roster and draft capital.</p>}
  </article>;
}
