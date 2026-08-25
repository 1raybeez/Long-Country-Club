import Link from 'next/link';
import { ArrowLeft, Crosshair, ShieldCheck, Sparkles } from 'lucide-react';
import { redirect } from 'next/navigation';
import { getOwnerById } from '@/lib/ownerRegistry';
import { hasCapability } from '@/lib/auth/memberResolver';
import { getCurrentMemberSession } from '@/lib/auth/session';
import { getWarRoomCurrentRoster, WAR_ROOM_ROSTER_POSITIONS, type WarRoomRosterPlayer, type WarRoomRosterPosition, type WarRoomRosterStatus } from '@/lib/warRoom/currentRoster';

export const dynamic = 'force-dynamic';

export default async function WarRoomPage() {
  const session = await getCurrentMemberSession();
  const member = session?.member;

  if (!member || !hasCapability(member, 'war-room')) {
    redirect('/?access=war-room-required');
  }

  const owner = getOwnerById(member.ownerId);

  if (!owner) {
    redirect('/?access=war-room-owner-required');
  }

  const roster = getWarRoomCurrentRoster(owner.ownerId);

  return (
    <main className="lcc2-page-shell">
      <div className="lcc2-page-container">
        <Link href="/" className="lcc2-button lcc2-button--secondary">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Home
        </Link>

        <header className="mt-8 max-w-3xl">
          <p className="lcc2-label text-[var(--lcc-brand-primary)]">Private Dynasty Operations</p>
          <h1 className="mt-2 font-ui text-4xl font-black tracking-[-0.04em] text-[var(--lcc-color-text)] sm:text-5xl">My War Room</h1>
          <p className="lcc2-body mt-3 max-w-2xl">Your private roster, draft-capital, and strategy workspace for Long Country Club.</p>
        </header>

        <section className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]" aria-label="War Room identity">
          <div className="lcc2-card lcc2-card--raised p-5 sm:p-6">
            <p className="lcc2-label text-[var(--lcc-brand-secondary)]">Authenticated owner</p>
            <h2 className="mt-2 font-ui text-2xl font-black text-[var(--lcc-color-text)]">{owner.displayName}</h2>
            <p className="mt-1 font-ui text-base font-semibold text-[var(--lcc-color-text-muted)]">{owner.teamName}</p>
            <p className="lcc2-body mt-5 max-w-xl">This workspace is resolved from your authenticated LCC member account. Current roster data is private to this canonical owner workspace.</p>
          </div>
          <aside className="lcc2-card p-5" aria-label="War Room access status">
            <ShieldCheck className="h-5 w-5 text-[var(--lcc-interactive)]" aria-hidden="true" />
            <p className="lcc2-label mt-3">Workspace status</p>
            <p className="mt-1 font-ui text-base font-black text-[var(--lcc-color-text)]">Private member access</p>
            <p className="lcc2-body mt-2 text-sm">Only your canonical owner workspace is available in this foundation slice.</p>
          </aside>
        </section>

        <section className="mt-8" aria-labelledby="war-room-foundation-heading">
          <div className="mb-4">
            <p className="lcc2-section-heading__eyebrow">Foundation roadmap</p>
            <h2 id="war-room-foundation-heading" className="lcc2-section-heading__title">Your War Room</h2>
            <p className="lcc2-section-heading__supporting">The private workspace is ready for its data-driven modules.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FoundationCard icon={<Crosshair className="h-5 w-5" aria-hidden="true" />} title="Roster" status="Available" description="Your current 2026 roster is available below." />
            <FoundationCard icon={<ShieldCheck className="h-5 w-5" aria-hidden="true" />} title="Draft Capital" status="Next Build" description="Canonical future-pick holdings will be connected later." />
            <FoundationCard icon={<Sparkles className="h-5 w-5" aria-hidden="true" />} title="Draft Strategy" status="Planned" description="Descriptive draft tendencies will be added after the shell is established." />
          </div>
        </section>

        <CurrentRosterSection roster={roster} teamName={owner.teamName} />
      </div>
    </main>
  );
}

function CurrentRosterSection({ roster, teamName }: { roster: ReturnType<typeof getWarRoomCurrentRoster>; teamName: string }) {
  if (!roster) {
    return <section className="mt-8 lcc2-card p-5" aria-labelledby="current-roster-heading"><p className="lcc2-label">Current roster</p><h2 id="current-roster-heading" className="mt-2 font-ui text-2xl font-black text-[var(--lcc-color-text)]">Roster unavailable</h2><p className="lcc2-body mt-2">The current 2026 roster snapshot is not available for {teamName} yet.</p></section>;
  }

  return <section className="mt-8" aria-labelledby="current-roster-heading">
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div><p className="lcc2-section-heading__eyebrow">2026 current roster</p><h2 id="current-roster-heading" className="lcc2-section-heading__title">{teamName}</h2><p className="lcc2-section-heading__supporting">Factual roster snapshot grouped by position.</p></div>
      <div className="flex flex-wrap gap-2" aria-label="Roster summary"><SummaryBadge label="Players" value={roster.players.length} /><SummaryBadge label="Active" value={roster.statusCounts.ACTIVE} /><SummaryBadge label="Taxi" value={roster.statusCounts.TAXI} />{roster.statusCounts.IR > 0 ? <SummaryBadge label="IR" value={roster.statusCounts.IR} /> : null}</div>
    </div>
    <div className="mb-5 grid grid-cols-3 gap-2 sm:grid-cols-6">{WAR_ROOM_ROSTER_POSITIONS.map((position) => <div key={position} className="lcc2-card p-3 text-center"><p className="lcc2-label text-xs">{position}</p><p className="mt-1 font-ui text-xl font-black text-[var(--lcc-color-text)]">{roster.positionCounts[position]}</p></div>)}</div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{WAR_ROOM_ROSTER_POSITIONS.map((position) => <RosterPositionCard key={position} position={position} players={roster.players.filter((player) => normalizePosition(player.position) === position)} />)}</div>
  </section>;
}

function RosterPositionCard({ position, players }: { position: WarRoomRosterPosition; players: readonly WarRoomRosterPlayer[] }) {
  return <article className="lcc2-card p-4"><div className="flex items-center justify-between gap-3"><h3 className="font-ui text-lg font-black text-[var(--lcc-color-text)]">{position}</h3><span className="lcc2-badge lcc2-badge--neutral">{players.length}</span></div>{players.length ? <ul className="mt-3 space-y-2">{players.map((player) => <li key={player.id} className="flex items-center gap-3 rounded-lg border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface-muted)] p-2"><div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface)]">{player.imageUrl ? <img src={player.imageUrl} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center font-ui text-xs font-black text-[var(--lcc-color-text-muted)]">{player.name.slice(0, 2).toUpperCase()}</span>}</div><div className="min-w-0 flex-1"><p className="truncate font-ui text-sm font-bold text-[var(--lcc-color-text)]">{player.name}</p><p className="truncate text-xs text-[var(--lcc-color-text-muted)]">{player.teamName ?? player.team ?? "NFL team unavailable"}</p></div><RosterStatus status={player.status} /></li>)}</ul> : <p className="lcc2-body mt-3 text-sm">No players in this position.</p>}</article>;
}

function SummaryBadge({ label, value }: { label: string; value: number }) { return <span className="lcc2-badge lcc2-badge--neutral"><span>{label}</span> <strong>{value}</strong></span>; }
function RosterStatus({ status }: { status: WarRoomRosterStatus }) { return <span className="shrink-0 text-[0.65rem] font-black tracking-[0.08em] text-[var(--lcc-color-text-muted)]">{status}</span>; }
function normalizePosition(position: string | null): WarRoomRosterPosition | null { return position === "DEF" ? "DST" : WAR_ROOM_ROSTER_POSITIONS.includes(position as WarRoomRosterPosition) ? position as WarRoomRosterPosition : null; }

function FoundationCard({ icon, title, status, description }: { icon: React.ReactNode; title: string; status: string; description: string }) {
  return (
    <article className="lcc2-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--lcc-color-surface-muted)] text-[var(--lcc-interactive)]">{icon}</div>
        <span className="lcc2-badge lcc2-badge--neutral">{status}</span>
      </div>
      <h3 className="mt-5 font-ui text-xl font-black text-[var(--lcc-color-text)]">{title}</h3>
      <p className="lcc2-body mt-2 text-sm">{description}</p>
    </article>
  );
}
