import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  ALL_LCC_OWNERS,
  LCC_ERA_MODEL,
  getLccOwnerById,
  getLccOwnerByProfileSlug,
  getLccOwnerProfileHref,
  getLccOwnerProfileSlug,
  type LccOwner,
} from "@/lib/lccOwners";

export function generateStaticParams() {
  return ALL_LCC_OWNERS.map((owner) => ({
    slug: getLccOwnerProfileSlug(owner),
  }));
}

type OwnerProfilePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function OwnerProfilePage({
  params,
}: OwnerProfilePageProps) {
  const { slug } = await params;
  const owner = getLccOwnerByProfileSlug(slug);

  if (!owner) {
    notFound();
  }

  const teamLabel = owner.status === "active" ? "Current team" : "Last team";
  const lastSeason = formatLastSeason(owner);
  const almanacProfile = owner.almanacProfile;
  const rivalOwner = almanacProfile?.rivalOwnerId
    ? getLccOwnerById(almanacProfile.rivalOwnerId)
    : undefined;
  const hasFanProfile = Boolean(
    almanacProfile?.favoriteCollegeTeam ||
      almanacProfile?.favoriteNFLTeam ||
      almanacProfile?.favoritePlayer
  );
  const hasTendencies = Boolean(
    almanacProfile?.mode ||
      almanacProfile?.preferredDraftPosition ||
      almanacProfile?.tradeActivityScale ||
      almanacProfile?.preferredContactMethods?.length ||
      almanacProfile?.draftingStrategy ||
      almanacProfile?.waiverWireAggression ||
      almanacProfile?.injuryManagement ||
      almanacProfile?.trashTalkRating
  );

  return (
    <main className="min-h-screen bg-[#F9F7F2] px-6 py-8 text-[#1A472A] md:px-12">
      <div className="mx-auto max-w-5xl">
        <nav className="mb-8">
          <Link
            href="/managers"
            className="inline-flex rounded-full border border-[#1A472A]/20 px-5 py-2 text-[10px] font-black uppercase tracking-widest text-[#1A472A] transition-all hover:bg-[#1A472A] hover:text-white"
          >
            Back to Managers
          </Link>
        </nav>

        <section className="grid gap-8 border-y-8 border-[#C5A059] py-8 md:grid-cols-[220px_1fr]">
          <div className="flex justify-center md:justify-start">
            <div className="h-44 w-44 overflow-hidden rounded-full border-8 border-white bg-white shadow-2xl">
              <img
                src={`/managers/${owner.avatarFilename}`}
                alt={owner.nickname}
                className="h-full w-full object-cover"
                style={{ objectPosition: "center 32%" }}
              />
            </div>
          </div>

          <div>
            <div className="mb-4 flex flex-wrap gap-2">
              <ProfileBadge>{formatStatus(owner.status)}</ProfileBadge>
              {owner.founder && <ProfileBadge>Founder</ProfileBadge>}
              {owner.commissioner && <ProfileBadge>Commissioner</ProfileBadge>}
              {owner.original2003Owner && (
                <ProfileBadge>Original 2003 Owner</ProfileBadge>
              )}
              {owner.inMemoriam && <ProfileBadge>In Memoriam</ProfileBadge>}
            </div>

            <h1 className="text-4xl font-black uppercase italic tracking-tighter md:text-6xl">
              {owner.displayName}
            </h1>
            <p className="mt-2 text-sm font-black uppercase tracking-widest text-[#1A472A]/60">
              {owner.nickname}
            </p>
          </div>
        </section>

        <section className="grid gap-4 py-8 md:grid-cols-2">
          <ProfileFact label={teamLabel} value={owner.managerPage.sleeperName} />
          <ProfileFact label="First season" value={owner.joinedYear ?? "Unknown"} />
          <ProfileFact label="Last season" value={lastSeason} />
          <ProfileFact label="Sleeper ID" value={owner.sleeperUserId ?? "None"} />
          <ProfileFact
            label="Era tags"
            value={owner.eraTags.map((key) => LCC_ERA_MODEL[key].label).join(", ")}
          />
          <ProfileFact
            label="Display history"
            value={
              owner.displayNameHistory.length > 0
                ? owner.displayNameHistory.join(", ")
                : "None"
            }
          />
        </section>

        {almanacProfile && (
          <section className="space-y-5 border-t border-[#1A472A]/15 py-8">
            {almanacProfile.bio && (
              <ProfileSection title="Owner Bio">
                <p className="text-sm font-medium leading-7 text-[#1A472A]/75">
                  {almanacProfile.bio}
                </p>
              </ProfileSection>
            )}

            {almanacProfile.philosophy && (
              <ProfileSection title="Franchise Philosophy">
                <p className="text-sm font-medium leading-7 text-[#1A472A]/75">
                  {almanacProfile.philosophy}
                </p>
              </ProfileSection>
            )}

            {hasFanProfile && (
              <ProfileSection title="Fan Profile">
                <div className="grid gap-3 md:grid-cols-3">
                  <AlmanacFact
                    label="College Team"
                    value={almanacProfile.favoriteCollegeTeam}
                  />
                  <AlmanacFact
                    label="NFL Team"
                    value={almanacProfile.favoriteNFLTeam}
                  />
                  <AlmanacFact
                    label="Favorite Player"
                    value={almanacProfile.favoritePlayer}
                  />
                </div>
              </ProfileSection>
            )}

            {hasTendencies && (
              <ProfileSection title="Trade & Draft Tendencies">
                <div className="grid gap-3 md:grid-cols-2">
                  <AlmanacFact label="Mode" value={almanacProfile.mode} />
                  <AlmanacFact
                    label="Preferred Draft Position"
                    value={almanacProfile.preferredDraftPosition}
                  />
                  <AlmanacFact
                    label="Trade Activity"
                    value={formatRating(almanacProfile.tradeActivityScale, 10)}
                  />
                  <AlmanacFact
                    label="Preferred Contact"
                    value={almanacProfile.preferredContactMethods?.join(", ")}
                  />
                  <AlmanacFact
                    label="Drafting Strategy"
                    value={almanacProfile.draftingStrategy}
                  />
                  <AlmanacFact
                    label="Waiver Wire"
                    value={almanacProfile.waiverWireAggression}
                  />
                  <AlmanacFact
                    label="Injury Management"
                    value={almanacProfile.injuryManagement}
                  />
                  <AlmanacFact
                    label="Trash Talk Rating"
                    value={almanacProfile.trashTalkRating}
                  />
                </div>
              </ProfileSection>
            )}

            {rivalOwner && (
              <ProfileSection title="Primary Rival">
                <Link
                  href={getLccOwnerProfileHref(rivalOwner)}
                  className="inline-flex border border-[#1A472A]/20 bg-white px-4 py-3 text-sm font-black uppercase italic tracking-tight text-[#1A472A] transition-all hover:bg-[#1A472A] hover:text-white"
                >
                  {rivalOwner.displayName}
                </Link>
              </ProfileSection>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

function ProfileBadge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-[#1A472A] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
      {children}
    </span>
  );
}

function ProfileFact({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="border border-[#1A472A]/15 bg-white/70 p-4 shadow-sm">
      <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-[#1A472A]/50">
        {label}
      </p>
      <p className="text-lg font-black uppercase italic tracking-tight text-[#1A472A]">
        {value}
      </p>
    </div>
  );
}

function ProfileSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border border-[#1A472A]/15 bg-white/70 p-5 shadow-sm">
      <h2 className="mb-4 text-xl font-black uppercase italic tracking-tight">
        {title}
      </h2>
      {children}
    </section>
  );
}

function AlmanacFact({
  label,
  value,
}: {
  label: string;
  value?: ReactNode;
}) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return (
    <div className="border border-[#1A472A]/10 bg-[#F9F7F2]/70 p-4">
      <p className="mb-1 text-[9px] font-black uppercase tracking-widest text-[#1A472A]/45">
        {label}
      </p>
      <p className="text-sm font-black uppercase italic tracking-tight text-[#1A472A]">
        {value}
      </p>
    </div>
  );
}

function formatStatus(status: LccOwner["status"]) {
  return status === "active" ? "Active" : "Retired";
}

function formatLastSeason(owner: LccOwner) {
  if (owner.lastSeason === "present") {
    return "Present";
  }

  return owner.lastSeason ?? "Unknown";
}

function formatRating(value: number | undefined, max: number) {
  if (value === undefined) {
    return undefined;
  }

  return `${value}/${max}`;
}
