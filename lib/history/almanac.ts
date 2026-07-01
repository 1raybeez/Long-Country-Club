import { loadAllSeasonSummaries } from "./seasonSummary";
import { getAllOwnerCareerSummaries } from "./career";
import { loadAllAwards } from "./awards";

export function getLeagueAlmanac() {
  return {
    seasons: loadAllSeasonSummaries(),
    careers: getAllOwnerCareerSummaries(),
    awards: loadAllAwards(),
  };
}