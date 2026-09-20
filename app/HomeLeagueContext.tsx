import Link from "next/link";
import { ArrowRight, CalendarDays, Landmark, ShieldCheck } from "lucide-react";
import type { HomeLeagueContext as HomeLeagueContextData } from "@/lib/homeLeagueContext";
import type { HomeWeeklyRecap as HomeWeeklyRecapData } from "@/lib/homeWeeklyRecap";
import { HomeWeeklyRecap } from "./HomeWeeklyRecap";

export function HomeLeagueContext({ context, recap }: { context: HomeLeagueContextData; recap: HomeWeeklyRecapData }) {
  return (
    <section className="mt-8" aria-labelledby="home-league-heading">
      <div className="lcc2-section-heading mb-5">
        <div><p className="lcc2-section-heading__eyebrow">League</p><h2 id="home-league-heading" className="lcc2-section-heading__title">The LCC context</h2></div>
      </div>
      <div className={`grid gap-4 md:grid-cols-2 ${context.nextEvent ? "lg:grid-cols-3" : "lg:grid-cols-3"}`}>
        <HomePayoutsCard payouts={context.payouts} />
        <HomeGovernanceCard governance={context.governance} />
        <HomeWeeklyRecap recap={recap} />
      </div>
      {context.nextEvent ? <div className="mt-4 grid gap-4 lg:grid-cols-3"><HomeNextEventCard event={context.nextEvent} /></div> : null}
    </section>
  );
}

function HomePayoutsCard({ payouts }: Pick<HomeLeagueContextData, "payouts">) {
  return <article className="lcc2-card lcc2-card--raised flex min-w-0 flex-col p-4 sm:p-5" aria-labelledby="home-payouts-heading">
    <div className="flex items-start justify-between gap-3"><div><p className="lcc2-label">LCC PAYOUTS</p><h3 id="home-payouts-heading" className="mt-2 font-ui text-xl font-black text-[var(--lcc-color-text)]">Public league finances</h3></div><Landmark className="h-5 w-5 shrink-0 text-[var(--lcc-interactive)]" aria-hidden="true" /></div>
    {payouts ? <div className="mt-4 grid gap-2"><ContextFact label="Dues assessed" value={formatMoney(payouts.duesAssessed)} /><ContextFact label="Dues collected" value={formatMoney(payouts.duesCollected)} /><ContextFact label="Dues outstanding" value={formatMoney(payouts.duesOutstanding)} /><ContextFact label="Award credits applied" value={formatMoney(payouts.awardCreditsApplied)} />{payouts.latestWeeklyHigh ? <ContextFact label={`Week ${payouts.latestWeeklyHigh.week} weekly high`} value={`${payouts.latestWeeklyHigh.teamName} · ${formatMoney(payouts.latestWeeklyHigh.amountCents / 100)}`} /> : null}</div> : <p className="lcc2-body mt-4">Public payout information is temporarily unavailable.</p>}
    <Link href="/league-info/fees" className="lcc2-button lcc2-button--secondary mt-auto w-full">View Fees &amp; Payouts<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
  </article>;
}

function HomeGovernanceCard({ governance }: Pick<HomeLeagueContextData, "governance">) {
  return <article className="lcc2-card lcc2-card--raised flex min-w-0 flex-col p-4 sm:p-5" aria-labelledby="home-governance-heading">
    <div className="flex items-start justify-between gap-3"><div><p className="lcc2-label">League governance</p><h3 id="home-governance-heading" className="mt-2 font-ui text-xl font-black text-[var(--lcc-color-text)]">{governance.title}</h3></div><ShieldCheck className="h-5 w-5 shrink-0 text-[var(--lcc-interactive)]" aria-hidden="true" /></div>
    <p className="lcc2-body mt-4">{governance.description}</p>
    <Link href={governance.cta.href} className="lcc2-button lcc2-button--secondary mt-auto w-full">{governance.cta.label}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
  </article>;
}

function HomeNextEventCard({ event }: { event: NonNullable<HomeLeagueContextData["nextEvent"]> }) {
  return <article className="lcc2-card lcc2-card--raised flex min-w-0 flex-col p-4 sm:p-5" aria-labelledby="home-next-event-heading">
    <div className="flex items-start justify-between gap-3"><div><p className="lcc2-label">Next event</p><h3 id="home-next-event-heading" className="mt-2 font-ui text-xl font-black text-[var(--lcc-color-text)]">{event.title}</h3></div><CalendarDays className="h-5 w-5 shrink-0 text-[var(--lcc-interactive)]" aria-hidden="true" /></div>
    <p className="lcc2-body mt-4">{event.detail ?? "Verified league event"}</p>
    <p className="mt-3 font-ui text-sm font-black text-[var(--lcc-color-text)]">{event.timestamp ? formatEventDate(event.timestamp) : "Date to be announced"}</p>
    {event.cta ? <Link href={event.cta.href} className="lcc2-button lcc2-button--secondary mt-auto w-full">{event.cta.label}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link> : null}
  </article>;
}

function ContextFact({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-[var(--lcc-color-surface-muted)] p-3"><p className="lcc2-label">{label}</p><p className="mt-1 break-words font-ui text-sm font-black text-[var(--lcc-color-text)]">{value}</p></div>;
}

function formatMoney(value: number | null) {
  return value === null ? "Unavailable" : `$${value.toFixed(2)}`;
}

function formatEventDate(timestamp: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "America/New_York" }).format(new Date(timestamp));
}
