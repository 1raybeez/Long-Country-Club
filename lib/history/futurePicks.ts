import futurePickInventory from '../../data/current/drafts/future-picks.json';
import type { FuturePickAsset, FuturePickInventory } from '../types/futurePick';

const INVENTORY = futurePickInventory as FuturePickInventory;

export function getFuturePickInventory(): FuturePickInventory {
  return INVENTORY;
}

export function getFuturePickYears(): readonly number[] {
  return INVENTORY.supportedFutureSeasons;
}

export function getFuturePickAssetsByYear(year: number): readonly FuturePickAsset[] {
  return INVENTORY.assets.filter((asset) => asset.season === year);
}

export function getFuturePickHoldingsByOwner(year: number) {
  const holdings = new Map<string, FuturePickAsset[]>();

  getFuturePickAssetsByYear(year).forEach((asset) => {
    const assets = holdings.get(asset.currentOwnerId) ?? [];
    assets.push(asset);
    holdings.set(asset.currentOwnerId, assets);
  });

  return holdings;
}
