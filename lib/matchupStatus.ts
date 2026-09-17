export type MatchupStatus = "UPCOMING" | "LIVE" | "FINAL" | "UNKNOWN";

export function formatMatchupStatus(status: MatchupStatus | undefined): string {
  if (status === "UPCOMING") return "Scheduled";
  if (status === "LIVE") return "Live";
  if (status === "FINAL") return "Final";
  if (status === "UNKNOWN") return "In Progress";
  return "Final";
}
