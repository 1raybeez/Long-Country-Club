import { loadAllRivalries } from "../lib/history/rivalries";
import { getOwnerById } from "../lib/ownerRegistry";

function name(ownerId: string) {
  return getOwnerById(ownerId)?.displayName ?? ownerId;
}

const rivalries = loadAllRivalries();

console.log("LCC Rivalry Engine Preview");
console.log("==========================");
console.log(`Total rivalries: ${rivalries.length}`);
console.log("");

for (const rivalry of rivalries.slice(0, 25)) {
  console.log(
    `${name(rivalry.ownerA)} vs ${name(rivalry.ownerB)} | ` +
      `${rivalry.winsA}-${rivalry.winsB}-${rivalry.ties} | ` +
      `${rivalry.meetings} meetings | ` +
      `${rivalry.playoffMeetings} playoff | ` +
      `${rivalry.firstSeason}-${rivalry.lastSeason}`
  );
}