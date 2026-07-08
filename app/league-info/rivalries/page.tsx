import { loadAllMatchups } from "@/lib/history/matchups";
import { loadAllRivalries } from "@/lib/history/rivalries";
import { getOwnerById } from "@/lib/ownerRegistry";
import { getOwnerImagePath } from "@/lib/ownerImages";
import { RivalryHubClient } from "./RivalryHubClient";

export default function RivalriesPage() {
  const rivalries = loadAllRivalries();
  const matchups = loadAllMatchups();

  const ownerIds = Array.from(
    new Set(rivalries.flatMap((rivalry) => [rivalry.ownerA, rivalry.ownerB]))
  ).sort((a, b) => ownerName(a).localeCompare(ownerName(b)));

  const owners = ownerIds.map((ownerId) => ({
    id: ownerId,
    displayName: ownerName(ownerId),
    imagePath: getOwnerImagePath(ownerId),
  }));

  return (
    <RivalryHubClient
      owners={owners}
      rivalries={rivalries}
      matchups={matchups}
    />
  );
}

function ownerName(ownerId: string) {
  return getOwnerById(ownerId)?.displayName ?? ownerId;
}