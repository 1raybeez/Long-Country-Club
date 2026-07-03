import { Award, Crown, Medal, Shield, Skull, Swords, Trophy } from "lucide-react";
import type { OwnerMatchupSummary } from "@/lib/history/ownerMatchupSummary";
import { getOwnerById } from "@/lib/ownerRegistry";
import { ProfileStatCard } from "@/components/ui/ProfileStatCard";

export function OwnerMatchupResumeCard({
  summary,
}: {
  summary: OwnerMatchupSummary;
}) {
  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-2 gap-2.5">
        <ProfileStatCard
          label="Record"
          value={formatRecord(summary.wins, summary.losses, summary.ties)}
          icon={<Trophy className="h-4 w-4" aria-hidden="true" />}
        />
        <ProfileStatCard
          label="Win %"
          value={formatWinPercentage(summary.winPercentage)}
          icon={<Medal className="h-4 w-4" aria-hidden="true" />}
        />
        <ProfileStatCard
          label="Playoffs"
          value={formatRecord(summary.playoffWins, summary.playoffLosses, 0)}
          icon={<Crown className="h-4 w-4" aria-hidden="true" />}
        />
        <ProfileStatCard
          label="Avg PF"
          value={formatNumber(summary.averagePointsFor)}
          icon={<Award className="h-4 w-4" aria-hidden="true" />}
        />
        <ProfileStatCard
          label="Biggest Win"
          value={formatMargin(summary.biggestWinMargin)}
          icon={<Shield className="h-4 w-4" aria-hidden="true" />}
        />
        <ProfileStatCard
          label="Biggest Loss"
          value={formatMargin(summary.biggestLossMargin)}
          icon={<Skull className="h-4 w-4" aria-hidden="true" />}
        />
      </div>

      <div className="grid gap-2.5">
        <ResumeFact
          icon={<Swords className="h-3.5 w-3.5" aria-hidden="true" />}
          label="Top Rivalry"
          value={formatOwnerName(summary.topRivalryOwnerId)}
        />
        <ResumeFact
          label="Favorite Victim"
          value={formatOwnerName(summary.favoriteVictimOwnerId)}
        />
        <ResumeFact
          label="Nemesis"
          value={formatOwnerName(summary.nemesisOwnerId)}
        />
      </div>
    </div>
  );
}

function ResumeFact({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-[var(--lcc-radius)] border border-[var(--lcc-border)] bg-[var(--lcc-surface-muted)] p-3">
      <p className="flex items-center gap-1.5 font-ui text-xs font-black uppercase text-[var(--lcc-text-muted)]">
        {icon}
        {label}
      </p>
      <p className="mt-1 font-serif text-base font-black uppercase italic leading-tight text-[var(--lcc-text)]">
        {value}
      </p>
    </div>
  );
}

function formatRecord(wins: number, losses: number, ties: number) {
  return ties > 0 ? `${wins}-${losses}-${ties}` : `${wins}-${losses}`;
}

function formatWinPercentage(value: number | null) {
  return value === null ? "—" : value.toFixed(3);
}

function formatNumber(value: number | null) {
  return value === null ? "—" : value.toLocaleString();
}

function formatMargin(value: number | null) {
  return value === null ? "—" : `+${value.toFixed(2)}`;
}

function formatOwnerName(ownerId: string | null) {
  if (!ownerId) return "—";
  return getOwnerById(ownerId)?.displayName ?? ownerId;
}