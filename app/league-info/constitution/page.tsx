'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function RulesOfPlay() {
  const [activeChapter, setActiveChapter] = useState<string | null>(null);
  const toggleChapter = (id: string) => setActiveChapter(activeChapter === id ? null : id);

  return (
    <div
      style={{
        backgroundColor: '#F9F7F2',
        minHeight: '100vh',
        paddingBottom: '80px',
        fontFamily: 'Georgia, ui-serif, serif',
      }}
    >
      {/* HEADER */}
      <header
        style={{
          textAlign: 'center',
          padding: '40px 16px 32px',
        }}
      >
        <Link
          href="/league-info"
          style={{
            textDecoration: 'none',
            color: '#1A472A',
            fontWeight: 'bold',
            fontSize: '0.9rem',
          }}
        >
          ← Back to Clubhouse
        </Link>
        <h1
          style={{
            fontSize: 'clamp(2rem, 4vw, 3.5rem)',
            color: '#1A472A',
            margin: '16px 0 8px',
          }}
        >
          The Rules of Play
        </h1>
        <p
          style={{
            color: '#C5A059',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.18em',
            fontSize: '0.75rem',
          }}
        >
          Official Long Country Club FFL Bylaws
        </p>
      </header>

      <main
        style={{
          maxWidth: '1000px',
          margin: '0 auto',
          padding: '0 16px',
        }}
      >
        <RuleSection
          id="financial"
          title="Financial Rules"
          isOpen={activeChapter === 'financial'}
          toggle={() => toggleChapter('financial')}
        >
          <Tag type="club">Club Rule</Tag>
          <RuleBlock title="Financial Transparency">
            <p>
              Financial details are published on the official Caddy Fees page. That ledger is where the league tracks
              current payments, balances, weekly highs, and payout notes.
            </p>
            <Link
              href="/league-info/fees"
              style={{
                display: 'inline-flex',
                marginTop: '8px',
                color: '#1A472A',
                fontWeight: 700,
                textDecoration: 'none',
                borderBottom: '2px solid #C5A059',
              }}
            >
              View Caddy Fees Ledger
            </Link>
          </RuleBlock>

          <Tag type="club">Club Rule</Tag>
          <RuleBlock title="Website as Source of Truth">
            <p>
              The website is the source of truth for published league financial rules and the current ledger. If a
              payment detail needs clarification, owners should reference the Caddy Fees ledger first.
            </p>
          </RuleBlock>

          <Tag type="club">Club Rule</Tag>
          <RuleBlock title="Ownership Expectations">
            <p>
              The annual league fee is <strong>$50</strong>. New owners pay <strong>$75</strong> in Year 1: $50 for the
              current season plus a <strong>$25</strong> future-season deposit.
            </p>
            <ul style={{ paddingLeft: '1.25rem', marginTop: '4px' }}>
              <li>Entry fees must be paid before the start of each season.</li>
              <li>If an owner leaves, they do not recoup the future-season fee.</li>
              <li>The forfeited future-season fee is awarded to the next Champion.</li>
            </ul>
          </RuleBlock>

          <Tag type="club">Club Rule</Tag>
          <RuleBlock title="Prize Money">
            <ul style={{ paddingLeft: '1.25rem', marginTop: '4px' }}>
              <li>$10 to the weekly high scorer during the 14-week regular season.</li>
              <li>$25 to 4th place.</li>
              <li>$50 to 3rd place.</li>
              <li>$100 to the runner-up.</li>
              <li>Champion receives $205 plus leftover ring reserve after actual ring cost.</li>
              <li>Up to $80 is allocated to the Champion ring.</li>
              <li>If the ring costs less, the remaining ring reserve goes to the Champion.</li>
            </ul>
          </RuleBlock>
        </RuleSection>

        {/* HOLE 1 */}
        <RuleSection
          id="h1"
          title="Hole 1: Ownership Expectations"
          isOpen={activeChapter === 'h1'}
          toggle={() => toggleChapter('h1')}
        >
          <Tag type="club">Club Rule</Tag>
          <RuleBlock title="1.1 Owner Commitment">
            <p>
              Paying league dues is an ownership commitment, not just an entry transaction. Fee amounts, new-owner
              deposits, forfeiture rules, and current balances are maintained in the{' '}
              <Link href="#financial" style={{ color: '#1A472A', fontWeight: 700 }}>
                Financial Rules
              </Link>{' '}
              section and on the{' '}
              <Link href="/league-info/fees" style={{ color: '#1A472A', fontWeight: 700 }}>
                Caddy Fees page
              </Link>
              .
            </p>
            <p>
              Owners are expected to pay before the season begins, stay active through the full league year, and
              communicate early if they may not return. New-owner future-season deposits exist to discourage
              abandonment and are handled under the financial rules if an owner leaves.
            </p>
          </RuleBlock>

          <Tag type="club">Club Rule</Tag>
          <RuleBlock title="1.2 Team Abandonment">
            <p>
              Owners must provide at least <strong>30 days&apos; notice before the draft</strong> if they plan to leave
              the league in good standing.
            </p>
            <p>
              Any departure after the draft is considered <strong>mid-season abandonment</strong>, even if it occurs
              before Week 1. Mid-season abandonment results in a permanent ban from the league, forfeiture of all fees,
              and the roster being transferred to Commissioner control until a replacement owner is found.
            </p>
          </RuleBlock>

          <Tag type="club">Club Rule</Tag>
          <RuleBlock title="1.3 Winter Owner's Meeting">
            <p>
              Any rule changes or votes for the upcoming season must be voted on after the Champion is crowned and
              before the NFL Draft. This Winter Owner&apos;s Meeting is typically held in late March or early April.
            </p>
            <p>
              Meetings may take place at a brewery, someone&apos;s home, via Zoom, or by Google Form. Rule changes may
              be nominated during the season, but cannot be voted on until the Winter Owner&apos;s Meeting. Mid-season
              proposals are collected in a running document for discussion at that meeting.
            </p>
            <p>
              Emergency Summer Meetings may occur only to vote on new owners if someone leaves the league, or to address
              a pandemic or natural disaster situation that impacts the season.
            </p>
          </RuleBlock>

          <Tag type="club">Club Rule</Tag>
          <RuleBlock title="1.4 Financial Rules Reference">
            <p>
              The official payout schedule lives in the Financial Rules section so the same dollar amounts are not
              repeated in multiple chapters. Hole 1 governs owner obligations; Hole 5 explains how postseason results
              establish prize eligibility.
            </p>
            <p>
              The current payment ledger, owner balances, future-season deposits, and weekly high-score records are
              maintained on the{' '}
              <Link href="/league-info/fees" style={{ color: '#1A472A', fontWeight: 700 }}>
                Caddy Fees page
              </Link>
              .
            </p>
          </RuleBlock>

          <Tag type="club">Club Rule</Tag>
          <RuleBlock title="1.5 Rookie Hazing">
            <p>
              The rest of the league chooses the team name for any first-year owner before the season begins. If the
              Sleeper platform allows the name, the league allows the name—no additional veto process is required.
            </p>
          </RuleBlock>
        </RuleSection>

        {/* HOLE 2 */}
        <RuleSection
          id="h2"
          title="Hole 2: Roster & Trade Standards"
          isOpen={activeChapter === 'h2'}
          toggle={() => toggleChapter('h2')}
        >
          <Tag type="hybrid">Hybrid Rule</Tag>
          <RuleBlock title="2.1 Divisions">
            <p>The league consists of two divisions:</p>
            <ul style={{ paddingLeft: '1.25rem', marginTop: '4px' }}>
              <li>OG Division — longest tenure.</li>
              <li>Newbie Division — shortest tenure.</li>
            </ul>
          </RuleBlock>

          <Tag type="hybrid">Hybrid Rule</Tag>
          <RuleBlock title="2.2 Roster Composition">
            <p>
              Each team maintains a <strong>23-player roster</strong>.
            </p>
            <p>A valid starting lineup must include:</p>
            <ul style={{ paddingLeft: '1.25rem', marginTop: '4px' }}>
              <li>1 Quarterback (QB)</li>
              <li>2 Running Backs (RB)</li>
              <li>3 Wide Receivers (WR)</li>
              <li>1 Tight End (TE)</li>
              <li>2 FLEX (RB/WR/TE)</li>
              <li>1 Defense/Special Teams (D/ST)</li>
              <li>1 Kicker (K)</li>
            </ul>
            <p>
              There are <strong>9 bench spots</strong> with no positional restrictions, and <strong>3 IR slots</strong>{' '}
              for players with eligible NFL designations.
            </p>
          </RuleBlock>

          <Tag type="hybrid">Hybrid Rule</Tag>
          <RuleBlock title="2.3 Injured Reserve (IR)">
            <p>
              The league uses <strong>3 IR spots</strong>. Only players designated by the NFL or Sleeper as IR, OUT, or
              PUP are eligible for IR placement.
            </p>
            <p>
              If a player becomes ineligible for IR, the owner has until <strong>Tuesday morning</strong> to move them
              back to the active roster. Repeated violations are handled at the Commissioner&apos;s discretion and may
              result in lineup changes, roster locks, or other remedies deemed fair.
            </p>
          </RuleBlock>

          <Tag type="club">Club Rule</Tag>
          <RuleBlock title="2.4 Taxi Squad">
            <p>
              Each team has a <strong>5-player Taxi Squad</strong>. Eligible players are rookies or sophomores after the
              inaugural rookie draft.
            </p>
            <p>
              Taxi players may be promoted or demoted between the Taxi Squad and active roster <strong>without limit</strong>,
              with no penalties. After a player&apos;s sophomore season, they must either be permanently promoted to the
              main roster or dropped to free agency.
            </p>
          </RuleBlock>

          <Tag type="hybrid">Hybrid Rule</Tag>
          <RuleBlock title="2.5 Trading">
            <p>
              Trading is allowed during the offseason and throughout the season until the trade deadline. The regular
              season trade deadline is the end of the last game of <strong>Week 10</strong>. Trades may resume when the
              new season begins on <strong>March 1st</strong>.
            </p>
            <p>
              Sleeper automatically approves trades once both parties accept. If any owner believes a trade is unfair,
              the Commissioner will post an <strong>8-hour poll</strong> in Sleeper. Owners involved in the trade are
              not allowed to vote, and a simple majority of votes cast determines the outcome.
            </p>
            <p>
              <strong>Start-Status Trade Rule:</strong> If you trade away a player whose NFL game has started or locked
              and receive a player who has not yet played, you cannot start the incoming player until the following
              week. This prevents owners from gaining a &quot;double-start&quot; in the same scoring period.
            </p>
            <p>
              If Sleeper does not enforce any trading or lineup rule correctly, the Commissioner may manually adjust
              rosters or lineups to preserve fairness.
            </p>
          </RuleBlock>

          <Tag type="hybrid">Hybrid Rule</Tag>
          <RuleBlock title="2.6 Free Agency (FAAB)">
            <p>
              Each team receives a <strong>$100 FAAB budget</strong> to use during the regular season and postseason.
              FAAB resets on the same day NFL Free Agency begins.
            </p>
            <p>
              Waiver wire acquisition processing begins at <strong>12 PM ET on Wednesday</strong> after the draft. During
              the season, waivers process daily at 12 PM ET, except on Tuesday, which is a locked day. If the NFL plays
              on a Tuesday, the league will allow waiver bids that day.
            </p>
            <p>
              A rolling waiver priority is used as a tiebreaker. Whenever you successfully claim a player, you move to
              the bottom of the waiver priority list. <strong>$0 bids</strong> are allowed.
            </p>
            <p>
              During the playoffs, only teams still competing may make waiver claims. Once your team is eliminated, you
              may no longer pick up players from waivers.
            </p>
          </RuleBlock>
        </RuleSection>

        {/* HOLE 3 */}
        <RuleSection
          id="h3"
          title="Hole 3: Tee Time Draft Rules"
          isOpen={activeChapter === 'h3'}
          toggle={() => toggleChapter('h3')}
        >
          <Tag type="club">Club Rule</Tag>
          <RuleBlock title="3.1 Inaugural Draft">
            <p>
              The inaugural draft is split into two parts: a Veterans Draft and a Rookie Draft. The Veterans Draft takes
              place in <strong>April</strong> before the NFL Draft and consists of <strong>19 rounds</strong>.
            </p>
            <p>
              All 19 picks must be used to fill your starting lineup; you cannot neglect a starting position. Each
              player has <strong>8 hours</strong> to make their pick or work out a trade. The Commissioner pauses the
              draft between <strong>10 PM and 11 PM ET</strong> and resumes at <strong>8 AM ET</strong>.
            </p>
            <p>
              The Year One Rookie Draft is held in <strong>May</strong> after the NFL Rookie Draft. It consists of{' '}
              <strong>4 rounds</strong>. Selected rookies may be added to your active roster or placed on your Taxi
              Squad. Each owner has 8 hours to make their pick or work out a trade, and the Commissioner pauses and
              resumes the draft at the same times as the Veterans Draft.
            </p>
          </RuleBlock>

          <Tag type="club">Club Rule</Tag>
          <RuleBlock title="3.2 Future Rookie Drafts">
            <p>
              Beginning in Year Two and beyond, the annual Rookie Draft will occur approximately{' '}
              <strong>one month after the NFL Draft</strong>.
            </p>
            <p>
              The Rookie Draft consists of <strong>4 rounds</strong>. Drafted players may be placed either on the active
              roster or the Taxi Squad. Each owner has <strong>8 hours</strong> to make their pick or negotiate a trade.
              The Commissioner will pause the draft around <strong>10 PM ET</strong> and resume around{' '}
              <strong>8 AM ET</strong>.
            </p>
          </RuleBlock>

          <Tag type="hybrid">Hybrid Rule</Tag>
          <RuleBlock title="3.3 Draft Order">
            <p>
              Draft order is determined by both regular season and playoff performance and follows a{' '}
              <strong>linear</strong> format, not a snake draft. If you have the 3rd pick, you will pick 3rd in every
              round.
            </p>
            <p>
              Teams finishing <strong>12th through 7th</strong> in the regular season determine picks 1–6 in the
              following draft. Teams finishing <strong>1st through 6th</strong> in the playoffs determine picks 7–12.
            </p>
            <p>Nomination mapping examples:</p>
            <ul style={{ paddingLeft: '1.25rem', marginTop: '4px' }}>
              <li>7th place = #6 nomination</li>
              <li>12th place = #1 nomination</li>
              <li>6th place = #7 nomination</li>
              <li>1st place = #12 nomination</li>
            </ul>
          </RuleBlock>
        </RuleSection>

        {/* HOLE 4 */}
        <RuleSection
          id="h4"
          title="Hole 4: The Official Scorecard"
          isOpen={activeChapter === 'h4'}
          toggle={() => toggleChapter('h4')}
        >
          <Tag type="sleeper">Sleeper Automated (Scoring Settings)</Tag>
          <RuleBlock title="4.1 Offensive Scoring">
            <p>
              The league uses a <strong>Half-Point PPR</strong> scoring system. Offensive scoring is as follows:
            </p>
            <p>
              <strong>Passing:</strong>
            </p>
            <ul style={{ paddingLeft: '1.25rem' }}>
              <li>+0.04 per passing yard (25 yards = 1 point)</li>
              <li>+4 per passing TD</li>
              <li>+2 per 2-point conversion</li>
              <li>-1 per interception thrown</li>
              <li>+0.01 per completion</li>
              <li>-0.01 per incompletion</li>
              <li>+2 bonus for 40+ yard passing TD</li>
            </ul>
            <p>
              <strong>Rushing:</strong>
            </p>
            <ul style={{ paddingLeft: '1.25rem' }}>
              <li>+0.1 per rushing yard (10 yards = 1 point)</li>
              <li>+6 per rushing TD</li>
              <li>+2 per 2-point conversion</li>
              <li>+2 bonus for 40+ yard rushing TD</li>
            </ul>
            <p>
              <strong>Receiving:</strong>
            </p>
            <ul style={{ paddingLeft: '1.25rem' }}>
              <li>+0.50 per reception</li>
              <li>+0.1 per receiving yard (10 yards = 1 point)</li>
              <li>+6 per receiving TD</li>
              <li>+2 per 2-point conversion</li>
              <li>+2 bonus for 40+ yard receiving TD</li>
            </ul>
          </RuleBlock>

          <Tag type="sleeper">Sleeper Automated</Tag>
          <RuleBlock title="4.2 Kicking & Defense/Special Teams">
            <p>
              <strong>Kicking:</strong>
            </p>
            <ul style={{ paddingLeft: '1.25rem' }}>
              <li>+3 for FG made (0–19 yards)</li>
              <li>+3 for FG made (20–29 yards)</li>
              <li>+3 for FG made (30–39 yards)</li>
              <li>+4 for FG made (40–49 yards)</li>
              <li>+5 for FG made (50+ yards)</li>
              <li>+1 per PAT made</li>
              <li>-2 for FG missed (0–19 yards)</li>
              <li>-2 for FG missed (20–29 yards)</li>
              <li>-2 for FG missed (30–39 yards)</li>
              <li>-1 for FG missed (40–49 yards)</li>
              <li>-2 per missed PAT</li>
            </ul>
            <p>
              <strong>Defense:</strong>
            </p>
            <ul style={{ paddingLeft: '1.25rem' }}>
              <li>+6 per defensive TD</li>
              <li>+10 for 0 points allowed</li>
              <li>+7 for 1–6 points allowed</li>
              <li>+4 for 7–13 points allowed</li>
              <li>+1 for 14–20 points allowed</li>
              <li>-1 for 21–27 points allowed</li>
              <li>-2 for 28–34 points allowed</li>
              <li>-5 for 35+ points allowed</li>
              <li>+1 per sack</li>
              <li>+2 per interception</li>
              <li>+2 per fumble recovery</li>
              <li>+0.50 per tackle for loss</li>
              <li>+2 per safety</li>
              <li>+1 per forced fumble</li>
              <li>+2 per blocked kick</li>
              <li>+1 per pass defended</li>
            </ul>
            <p>
              <strong>Special Teams Defense:</strong>
            </p>
            <ul style={{ paddingLeft: '1.25rem' }}>
              <li>+6 per special teams TD</li>
              <li>+1 per special teams forced fumble</li>
              <li>+1 per special teams fumble recovery</li>
              <li>+0.08 per punt return yard (12 yards = 1 point)</li>
              <li>+0.04 per kick return yard (25 yards = 1 point)</li>
            </ul>
          </RuleBlock>

          <Tag type="sleeper">Sleeper Automated</Tag>
          <RuleBlock title="4.3 Miscellaneous & Bonus Scoring">
            <p>
              <strong>Miscellaneous:</strong>
            </p>
            <ul style={{ paddingLeft: '1.25rem' }}>
              <li>-1 per fumble</li>
              <li>-2 per fumble lost</li>
              <li>+6 per fumble recovery TD</li>
            </ul>
            <p>
              <strong>Bonus Points:</strong>
            </p>
            <ul style={{ paddingLeft: '1.25rem' }}>
              <li>+2 for 100–199 yard rushing game</li>
              <li>+4 for 200+ yard rushing game</li>
              <li>+2 for 100–199 yard receiving game</li>
              <li>+4 for 200+ yard receiving game</li>
              <li>+2 for 300–399 yard passing game</li>
              <li>+3 for 400+ yard passing game</li>
            </ul>
          </RuleBlock>
        </RuleSection>

        {/* HOLE 5 */}
        <RuleSection
          id="h5"
          title="Hole 5: Postseason"
          isOpen={activeChapter === 'h5'}
          toggle={() => toggleChapter('h5')}
        >
          <Tag type="hybrid">Hybrid Rule</Tag>
          <RuleBlock title="5.1 Playoff Format">
            <p>
              The postseason begins in <strong>Week 15</strong>. A total of <strong>6 teams</strong> advance to the
              playoffs.
            </p>
            <ul style={{ paddingLeft: '1.25rem' }}>
              <li>Seeds 1 &amp; 2: Division winners with the best overall records.</li>
              <li>Seeds 3 &amp; 4: Next two best records (regardless of division).</li>
              <li>Seeds 5 &amp; 6: Two highest-scoring teams not already seeded.</li>
            </ul>
            <p>
              Each round, the highest remaining seed plays the lowest remaining seed. This structure ensures that both
              win–loss record and total points scored are rewarded.
            </p>
          </RuleBlock>

          <Tag type="hybrid">Hybrid Rule</Tag>
          <RuleBlock title="5.2 Regular Season Tiebreakers">
            <p>If two teams finish with the same record, the following tiebreakers are applied in order:</p>
            <ul style={{ paddingLeft: '1.25rem' }}>
              <li>Points For (most total points scored).</li>
              <li>Higher Points Against (tougher schedule).</li>
              <li>Head-to-head record.</li>
              <li>
                If still tied, the Commissioner may use a coin toss or another fair metric at their discretion as a
                final tiebreaker.
              </li>
            </ul>
          </RuleBlock>

          <Tag type="club">Club Rule</Tag>
          <RuleBlock title="5.3 Playoff Game Tiebreakers">
            <p>
              If a playoff matchup ends in a tie, the winner is determined by the team with the{' '}
              <strong>highest bench score</strong>.
            </p>
            <p>
              If bench scores are also tied, the <strong>higher seed automatically advances</strong> to the next round.
            </p>
          </RuleBlock>

          <Tag type="club">Club Rule</Tag>
          <RuleBlock title="5.4 Prize Eligibility & The Ring">
            <p>
              Payout amounts, weekly high-score rules, forfeited future-season fees, and the Champion ring reserve are
              defined in the Financial Rules section and reflected on the{' '}
              <Link href="/league-info/fees" style={{ color: '#1A472A', fontWeight: 700 }}>
                Caddy Fees ledger
              </Link>
              .
            </p>
            <p>
              For postseason purposes, final playoff results establish 1st place, runner-up, 3rd place, and 4th place
              prize eligibility. Weekly high-score payouts are regular-season awards only.
            </p>
          </RuleBlock>
        </RuleSection>

        {/* HOLE 6 */}
        <RuleSection
          id="h6"
          title="Hole 6: Mulligans & Emergency Protocols"
          isOpen={activeChapter === 'h6'}
          toggle={() => toggleChapter('h6')}
        >
          <Tag type="club">Club Rule</Tag>
          <RuleBlock title="6.1 Official Season Determination">
            <p>
              A season is considered <strong>official</strong> if <strong>9 weeks</strong> of NFL games are completed.
              This aligns with the trade deadline and allows teams enough time to demonstrate competitiveness.
            </p>
          </RuleBlock>

          <Tag type="club">Club Rule</Tag>
          <RuleBlock title="6.2 Entry Fees During Emergency Seasons">
            <p>
              Entry fee amounts are defined in the Financial Rules section. Emergency seasons only affect whether
              collected fees are paid out, partially paid out, or carried forward.
            </p>
            <p>
              If the season does not reach the official threshold (fewer than 9 weeks), the season is considered
              unofficial and fees are handled according to the emergency payout and carryover rules.
            </p>
          </RuleBlock>

          <Tag type="club">Club Rule</Tag>
          <RuleBlock title="6.3 Emergency Payout Structure">
            <p>
              If an <strong>unofficial season</strong> occurs (fewer than 9 weeks played), the season is null and void.
              No payouts are awarded, and any entry fees carry over to the following season. Weekly high-score payouts
              are canceled.
            </p>
            <p>
              If an <strong>official but shortened season</strong> occurs (9+ weeks but the fantasy playoffs or
              championship are not completed), payouts are based on playoff seeding and standard rules at the time the
              season ends.
            </p>
            <ul style={{ paddingLeft: '1.25rem' }}>
              <li>Only teams in playoff positions 1–6 are eligible for shortened-season payouts.</li>
              <li>Teams not yet eliminated from the playoffs receive payouts.</li>
              <li>No shortened-season payout will be less than $50.</li>
              <li>
                Payouts are based on the standard annual entry-fee pool, minus regular-season weekly high-score payouts
                for completed weeks and any league-approved administrative costs.
              </li>
            </ul>
            <p>
              Detailed week-by-week payout tables (for seasons ending between Weeks 10–18) are defined in the official
              document and can be referenced by the Commissioner when needed.
            </p>
          </RuleBlock>

          <Tag type="club">Club Rule</Tag>
          <RuleBlock title="6.4 Emergency IR Expansion">
            <p>
              The league&apos;s baseline IR settings are defined in Rule 2.3. For any season affected by a pandemic or
              natural disaster, the Commissioner may evaluate temporary emergency IR relief for players impacted by the
              event.
            </p>
            <p>
              Owners are responsible for self-policing any emergency IR accommodation and must ensure it is used only
              for pandemic or disaster-related designations. Abuse may result in ridicule from other owners or
              Commissioner intervention.
            </p>
            <p>
              No special preference is given to any owner impacted by players on IR, as all owners share the same waiver
              and roster tools.
            </p>
          </RuleBlock>

          <Tag type="club">Club Rule</Tag>
          <RuleBlock title="6.5 Game Postponement or Cancellation">
            <p>
              If the NFL postpones or cancels games for specific teams due to a pandemic or natural disaster, the
              default approach is that <strong>no special action</strong> will be taken. Owners must use IR, bench
              depth, and waivers to manage their rosters and field legal lineups.
            </p>
            <p>
              If a <strong>mass amount of games</strong> are postponed or canceled, the Commissioner and league will
              discuss potential responses and determine a fair and reasonable course of action, if one can be agreed
              upon.
            </p>
          </RuleBlock>
        </RuleSection>

        {/* HOLE 7 */}
        <RuleSection
          id="h7"
          title="Hole 7: The Scorekeeper’s Ledger"
          isOpen={activeChapter === 'h7'}
          toggle={() => toggleChapter('h7')}
        >
          <Tag type="club">Club Rule</Tag>
          <RuleBlock title="7.1 Revision History">
            <p>
              The Long Country Club FFL maintains a revision history to track rule changes voted on by the league. This
              ensures transparency and preserves the historical accuracy of the bylaws.
            </p>
            <p>
              <strong>Version 1 — 08/07/19</strong>
            </p>
            <ul style={{ paddingLeft: '1.25rem' }}>
              <li>
                Top 4 teams with the best record and top 2 teams with the most points scored make the playoffs (6 total
                teams). (Passed 6–5)
              </li>
              <li>
                Owners must be online or in-person at the draft; auto-drafting is not allowed. (Passed 6–5)
              </li>
              <li>
                The Commissioner can immediately approve a trade unless someone voices concern; then it must go to a
                league poll in Sleeper and be voted on within 8 hours. (Passed 8–3)
              </li>
              <li>
                The league gets to pick the team name for any new team in their first year. In Year 2, that owner may
                pick their own name. (Passed 6–3–2)
              </li>
            </ul>

            <p>
              <strong>Version 2 — 02/07/20</strong>
            </p>
            <ul style={{ paddingLeft: '1.25rem' }}>
              <li>Payouts changed so that only 4th place or higher receives money. (Passed 10–1)</li>
              <li>High score payouts were removed from the playoffs. (Passed 10–1)</li>
            </ul>

            <p>
              <strong>Version 3 — 04/20/21</strong>
            </p>
            <ul style={{ paddingLeft: '1.25rem' }}>
              <li>Full document overhauled based on the 03/29/21 Winter Owner&apos;s Meeting.</li>
            </ul>

            <p>
              <strong>Version 4 — 03/27/22</strong>
            </p>
            <ul style={{ paddingLeft: '1.25rem' }}>
              <li>
                Rule 2.1: Two divisions created, decided by oldest tenure vs. shortest tenure. (Passed 10–0)
              </li>
              <li>Rule 2.2.3: Added one additional bench spot. (Passed 10–0)</li>
              <li>Rule 2.2.5: Added one additional Taxi Squad spot. (Passed 10–0)</li>
              <li>Rule 2.2.4: Added one additional IR spot. (Passed 10–0)</li>
              <li>
                Rule 2.4.1: Free Agency budget and season will reset on the same day as NFL Free Agency. (Passed 10–0)
              </li>
              <li>
                Rule 3.2: Rookie Draft will take place one month after the NFL Rookie Draft. (Passed 10–0)
              </li>
              <li>
                Rule 5.1.1: Playoff seeds updated to be the 2 division winners, the next 2 best records, and the top 2
                teams in points not in the first 4 seeds. (Passed 10–0)
              </li>
            </ul>

            <p>
              <strong>Version 5 — 10/27/22</strong>
            </p>
            <ul style={{ paddingLeft: '1.25rem' }}>
              <li>
                Rules 1.4.5 &amp; 1.4.6: The league decided to award the winner a Championship Ring instead of a trophy.
                The Champion&apos;s payout changed to $205 plus any remaining funds from the cost of buying and shipping
                the ring. (Passed 10–0; 7 members voted to institute beginning that year.)
              </li>
            </ul>

            <p>
              <strong>Version 6 — 03/03/24</strong>
            </p>
            <ul style={{ paddingLeft: '1.25rem' }}>
              <li>
                Rule 2.3.2.1: Trade deadline moved to Week 10 to match the NFL&apos;s trade deadline. (League voted 8–2
                in favor)
              </li>
            </ul>
          </RuleBlock>

          <Tag type="club">Club Rule</Tag>
          <RuleBlock title="7.2 Document Approval Log">
            <p>The following approvals certify the revisions to the Long Country Club FFL Rule Book:</p>
            <ul style={{ paddingLeft: '1.25rem' }}>
              <li>
                Raymond Long — Commish — (804) 647-1100 — Approved 08/31/19
              </li>
              <li>
                Raymond Long — Commish — (804) 647-1100 — Approved 08/31/20
              </li>
              <li>
                Raymond Long — Commish — (804) 647-1100 — Approved 04/20/21
              </li>
              <li>
                Raymond Long — Commish — (804) 647-1100 — Approved 03/27/22
              </li>
              <li>
                Raymond Long — Commish — (804) 647-1100 — Approved 10/27/22
              </li>
              <li>
                Raymond Long — Commish — (804) 647-1100 — Approved 03/03/24
              </li>
            </ul>
          </RuleBlock>
        </RuleSection>
      </main>
    </div>
  );
}

// COMPONENTS
function RuleSection({
  id,
  title,
  children,
  isOpen,
  toggle,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  toggle: () => void;
}) {
  return (
    <section
      id={id}
      style={{
        marginBottom: '16px',
        backgroundColor: 'white',
        borderRadius: '14px',
        overflow: 'hidden',
        boxShadow: '0 4px 15px rgba(0,0,0,0.04)',
      }}
    >
      <button
        onClick={toggle}
        style={{
          width: '100%',
          padding: '18px 18px',
          border: 'none',
          backgroundColor: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          fontWeight: 700,
          fontSize: 'clamp(1.1rem, 2.2vw, 1.4rem)',
          color: '#1A472A',
          textAlign: 'left',
        }}
        aria-expanded={isOpen}
        aria-controls={`${id}-content`}
      >
        <span>{title}</span>
        <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{isOpen ? '−' : '+'}</span>
      </button>
      {isOpen && (
        <div
          id={`${id}-content`}
          style={{
            padding: '0 18px 22px',
            borderTop: '1px solid #eee',
          }}
        >
          {children}
        </div>
      )}
    </section>
  );
}

function RuleBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: '20px' }}>
      <h4
        style={{
          margin: '0 0 6px 0',
          color: '#C5A059',
          textTransform: 'uppercase',
          fontSize: '0.85rem',
          letterSpacing: '0.12em',
        }}
      >
        {title}
      </h4>
      <div
        style={{
          color: '#333',
          fontSize: '0.98rem',
          lineHeight: 1.7,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Tag({ type, children }: { type: 'sleeper' | 'club' | 'hybrid'; children: React.ReactNode }) {
  let bg = '#C5A059';
  if (type === 'sleeper') bg = '#2e7d32';
  if (type === 'hybrid') bg = '#003366';

  return (
    <span
      style={{
        display: 'inline-block',
        backgroundColor: bg,
        color: 'white',
        padding: '4px 10px',
        borderRadius: '999px',
        fontSize: '0.7rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        marginTop: '10px',
        marginRight: '8px',
        letterSpacing: '0.08em',
      }}
    >
      {children}
    </span>
  );
}
