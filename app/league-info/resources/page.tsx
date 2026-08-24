'use client';

import { useState } from "react";
import { BarChart3, BookOpen, ExternalLink, Globe, Mic2 } from "lucide-react";
import { LEAGUE_RESOURCE_GROUPS, type LeagueResource } from '@/lib/resources';
import { LeagueInfoShell } from '@/components/league/LeagueInfoShell';

const RESOURCE_GROUPS = LEAGUE_RESOURCE_GROUPS.map((group) => ({
  ...group,
  icon: group.id === 'podcasts' ? Mic2 : group.id === 'websites' ? Globe : BarChart3,
}));

type ResourceGroupId = (typeof RESOURCE_GROUPS)[number]["id"];

export default function ResourcesPage() {
  const [activeTab, setActiveTab] = useState<ResourceGroupId>("podcasts");
  const activeGroup = RESOURCE_GROUPS.find((group) => group.id === activeTab) ?? RESOURCE_GROUPS[0];
  const ActiveIcon = activeGroup.icon;

  return (
    <LeagueInfoShell>
      <main className="lcc2-page-shell">
      <div className="lcc2-page-container">
        <header className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
          <div>
            <p className="lcc2-label text-[var(--lcc-brand-primary)]">Resources</p>
            <h1 className="lcc2-home-identity__title mt-2">Resources</h1>
            <p className="lcc2-home-identity__supporting max-w-3xl">
              Fantasy football tools, rankings, podcasts, research, and reference resources used around the league.
            </p>
          </div>
          <aside className="lcc2-card lcc2-card--raised p-4" aria-label="Resource directory summary">
            <BookOpen className="h-5 w-5 text-[var(--lcc-interactive)]" aria-hidden="true" />
            <p className="lcc2-label mt-3">League reference</p>
            <p className="mt-1 font-ui text-sm font-semibold text-[var(--lcc-color-text)]">
              {RESOURCE_GROUPS.reduce((total, group) => total + group.resources.length, 0)} curated resources across three categories.
            </p>
          </aside>
        </header>

        <div className="mt-6" role="tablist" aria-label="Resource categories">
          <div className="flex flex-wrap gap-2">
            {RESOURCE_GROUPS.map((group) => {
              const Icon = group.icon;
              const isActive = group.id === activeTab;
              return (
                <button
                  key={group.id}
                  id={`resource-tab-${group.id}`}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`resource-panel-${group.id}`}
                  onClick={() => setActiveTab(group.id)}
                  className={[
                    "inline-flex min-h-11 items-center gap-2 rounded-lg border px-4 py-2 font-ui text-xs font-black uppercase tracking-[0.04em] transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--lcc-interactive-focus)]",
                    isActive
                      ? "border-[var(--lcc-brand-primary)] bg-[var(--lcc-brand-primary)] text-white"
                      : "border-[var(--lcc-color-border)] bg-[var(--lcc-color-surface-raised)] text-[var(--lcc-color-text-muted)] hover:border-[var(--lcc-interactive)] hover:text-[var(--lcc-interactive)]",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {group.label}
                </button>
              );
            })}
          </div>
        </div>

        <section id={`resource-panel-${activeGroup.id}`} className="mt-6" role="tabpanel" aria-labelledby={`resource-tab-${activeGroup.id}`}>
          <div className="mb-4 flex items-center gap-2">
            <ActiveIcon className="h-4 w-4 text-[var(--lcc-interactive)]" aria-hidden="true" />
            <h2 className="font-ui text-xl font-black text-[var(--lcc-color-text)]">{activeGroup.label}</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {activeGroup.resources.map((resource) => <ResourceCard key={resource.id} resource={resource} />)}
          </div>
        </section>
      </div>
      </main>
    </LeagueInfoShell>
  );
}

function ResourceCard({ resource }: { resource: LeagueResource }) {
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open ${resource.name} in a new tab`}
      className="lcc2-card lcc2-card--interactive group flex min-h-[12rem] flex-col justify-between p-5 hover:-translate-y-1"
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <span className={`lcc2-badge ${resource.type === "Premium" ? "lcc2-badge--warning" : resource.type === "Freemium" ? "lcc2-badge--info" : "lcc2-badge--neutral"}`}>
            {resource.type}
          </span>
          <ExternalLink className="h-4 w-4 shrink-0 text-[var(--lcc-color-text-muted)] transition-colors group-hover:text-[var(--lcc-interactive)]" aria-hidden="true" />
        </div>
        <h3 className="mt-5 font-ui text-lg font-black leading-tight text-[var(--lcc-color-text)]">{resource.name}</h3>
        <p className="lcc2-body mt-2">{resource.description}</p>
      </div>
      <span className="mt-5 font-ui text-xs font-black uppercase tracking-[0.06em] text-[var(--lcc-interactive)]">Open resource</span>
    </a>
  );
}
