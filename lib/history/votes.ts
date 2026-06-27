import votesIndex from '../../data/history/votes/index.json';
import type { VoteRecord } from '../types/vote';

// TODO: Migrate rule vote sheets/forms from Google Forms response exports.
const VOTES = votesIndex as readonly VoteRecord[];

export function loadAllVotes(): readonly VoteRecord[] {
  return VOTES;
}

export function loadVotesBySeason(season: number): readonly VoteRecord[] {
  return VOTES.filter((vote) => vote.season === season);
}

export function loadVoteById(id: string): VoteRecord | null {
  return VOTES.find((vote) => vote.id === id) ?? null;
}
