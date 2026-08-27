import { TRADE_VERDICT_MODEL_VERSION, type TradeOffStatus, type TradeType, type TradeVerdict, type TradeVerdictInput, type TradeVerdictParticipant, type TradeVerdictResult } from "./tradeVerdictTypes.ts";

const status = (value: number | null | undefined): TradeOffStatus => value === undefined || value === null ? "UNAVAILABLE" : value > 0 ? "IMPROVES" : value < 0 ? "DECLINES" : "UNCHANGED";
const deltaStatus = (value: number | null | undefined): TradeOffStatus => value === undefined || value === null ? "UNAVAILABLE" : value > 0 ? "IMPROVES" : value < 0 ? "DECLINES" : "UNCHANGED";
const ageStatus = (value: "YOUNGER" | "OLDER" | "UNCHANGED" | "UNAVAILABLE"): TradeOffStatus => value === "YOUNGER" ? "IMPROVES" : value === "OLDER" ? "DECLINES" : value === "UNCHANGED" ? "UNCHANGED" : "UNAVAILABLE";
const capitalStatus = (value: "INCREASED" | "DECREASED" | "UNCHANGED" | "UNAVAILABLE"): TradeOffStatus => value === "INCREASED" ? "IMPROVES" : value === "DECREASED" ? "DECLINES" : value === "UNCHANGED" ? "UNCHANGED" : "UNAVAILABLE";

export function calculateTradeVerdict(inputs: readonly TradeVerdictInput[]): TradeVerdictResult {
  const participants = inputs.map(buildParticipant);
  return { modelVersion: TRADE_VERDICT_MODEL_VERSION, summary: buildSummary(inputs, participants), participants, warnings: participants.filter((participant) => participant.evidenceStatus !== "COMPLETE").map((participant) => `${participant.franchiseName}: evidence is ${participant.evidenceStatus.toLowerCase()}.`) };
}

function buildParticipant(input: TradeVerdictInput): TradeVerdictParticipant {
  const roster = input.rosterImpact;
  const dynasty = input.dynasty;
  const lineup = deltaStatus(roster ? roster.delta.expectedLineupStrength : undefined);
  const depthChanges = roster?.changes.positionalDepthChanges ?? [];
  const depthImproved = depthChanges.some((change) => change.change === "IMPROVED");
  const depthReduced = depthChanges.some((change) => change.change === "REDUCED");
  const depth: TradeOffStatus = roster ? depthImproved && depthReduced ? "MIXED" : depthImproved ? "IMPROVES" : depthReduced ? "DECLINES" : "UNCHANGED" : "UNAVAILABLE";
  const career = dynasty ? ageStatus(dynasty.changes.age) : "UNAVAILABLE";
  const future = dynasty ? capitalStatus(dynasty.changes.futureCapital) : "UNAVAILABLE";
  const direction = dynasty ? dynasty.before.direction === dynasty.after.direction ? "UNCHANGED" : "MIXED" : "UNAVAILABLE";
  const longTermGain = career === "IMPROVES" || future === "IMPROVES" || (dynasty?.changes.rosterValue === "INCREASED");
  const move = tradeType(lineup, career, future, depth, longTermGain);
  const verdict = verdictFor(dynasty, lineup, longTermGain);
  const market = marketText(input.market.netValueChange, input.market.fairnessBand);
  const rosterText = lineup === "IMPROVES" ? "The expected starting lineup improves" : lineup === "DECLINES" ? "The expected starting lineup declines" : lineup === "UNCHANGED" ? "The expected starting lineup is unchanged" : "Starting-lineup evidence is unavailable";
  const dynastyText = dynasty ? dynasty.presentation?.fitExplanation ?? dynasty.fitReasons.join(" ") : "Dynasty-direction evidence is unavailable";
  const conflict = lineup === "DECLINES" && longTermGain ? "The trade improves long-term flexibility while sacrificing current scoring" : lineup === "IMPROVES" && (career === "DECLINES" || future === "DECLINES") ? "The trade improves current scoring while giving up some long-term flexibility" : null;
  const explanation = `${market}. ${rosterText}. ${conflict ?? dynastyText}.`;
  return { franchiseId: input.franchiseId, franchiseName: input.franchiseName, verdict, tradeType: move, explanation, tradeOffs: { marketValue: status(input.market.netValueChange), currentLineup: lineup, rosterDepth: depth, careerWindow: career, futureCapital: future, dynastyDirection: direction }, evidenceStatus: !roster || !dynasty ? "PARTIAL" : roster.status === "INCOMPLETE" || dynasty.status === "INCOMPLETE" ? "INCOMPLETE" : roster.status === "PARTIAL" || dynasty.status === "PARTIAL" ? "PARTIAL" : "COMPLETE" };
}

function verdictFor(dynasty: TradeVerdictInput["dynasty"], lineup: TradeOffStatus, longTermGain: boolean): TradeVerdict { if (!dynasty || dynasty.tradeFit === "INSUFFICIENT EVIDENCE") return "INSUFFICIENT EVIDENCE"; if ((dynasty.before.direction === "CONTENDER" || dynasty.before.direction === "PLAYOFF PUSH") && lineup === "DECLINES" && longTermGain) return dynasty.tradeFit === "POOR FIT" ? "POOR STRATEGIC FIT" : "QUESTIONABLE FIT"; if ((dynasty.before.direction === "REBUILDING") && lineup === "DECLINES" && longTermGain) return "GOOD STRATEGIC FIT"; return dynasty.tradeFit === "STRONG FIT" ? "STRONG STRATEGIC FIT" : dynasty.tradeFit === "FIT" ? "GOOD STRATEGIC FIT" : dynasty.tradeFit === "POOR FIT" ? "POOR STRATEGIC FIT" : "MIXED FIT"; }
function tradeType(lineup: TradeOffStatus, career: TradeOffStatus, future: TradeOffStatus, depth: TradeOffStatus, longTermGain: boolean): TradeType { if (lineup === "IMPROVES" && (career === "DECLINES" || future === "DECLINES")) return "WIN-NOW MOVE"; if (career === "IMPROVES" && longTermGain) return "YOUTH MOVE"; if (future === "IMPROVES") return "FUTURE-CAPITAL MOVE"; if (depth === "IMPROVES" && lineup !== "IMPROVES") return "DEPTH MOVE"; if (lineup === "UNCHANGED" && career === "UNCHANGED" && future === "UNCHANGED") return "BALANCED MOVE"; return "MIXED-DIRECTION MOVE"; }
function marketText(net: number, band: string | null) { if (Math.abs(net) < 250 || band === "VERY EVEN") return "Market value is nearly even"; return net > 0 ? "Receives more current dynasty market value" : "Gives up more current dynasty market value"; }
function buildSummary(inputs: readonly TradeVerdictInput[], participants: readonly TradeVerdictParticipant[]) { const market = inputs.every((input) => input.market.fairnessBand === "VERY EVEN") ? "This is a nearly even market-value trade" : "This trade has an uneven market-value exchange"; const immediate = participants.filter((participant) => participant.tradeOffs.currentLineup === "IMPROVES").map((participant) => participant.franchiseName); const longTerm = participants.filter((participant) => participant.tradeOffs.futureCapital === "IMPROVES" || participant.tradeOffs.careerWindow === "IMPROVES").map((participant) => participant.franchiseName); if (immediate.length && longTerm.length) return `${market} with different strategic effects. ${immediate.join(" and ")} improve${immediate.length === 1 ? "s" : ""} the current lineup, while ${longTerm.join(" and ")} gain${longTerm.length === 1 ? "s" : ""} longer-term flexibility.`; return `${market} with franchise-specific strategic effects.`; }
