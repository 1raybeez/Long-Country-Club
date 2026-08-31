export interface SandboxParticipantState {
  assets: string[];
  destinations: Record<string, string>;
}

export function isSandboxTradeValid(participants: SandboxParticipantState[], validAssetIds?: ReadonlySet<string>): boolean {
  if (participants.length < 2 || participants.length > 4) return false;
  if (participants.some((participant) => participant.assets.length === 0)) return false;
  const assets = participants.flatMap((participant) => participant.assets);
  if (new Set(assets).size !== assets.length) return false;
  if (validAssetIds && assets.some((assetId) => !validAssetIds.has(assetId))) return false;
  if (participants.length === 2) return true;
  return participants.every((participant, index) => participant.assets.every((assetId) => {
    const destination = participant.destinations[assetId];
    return Boolean(destination) && destination !== `Team ${String.fromCharCode(65 + index)}` && participants.some((_, destinationIndex) => destination === `Team ${String.fromCharCode(65 + destinationIndex)}`);
  }));
}
