"use client";

import { useState } from "react";

type Props = {
  snapshotDate: string;
  evidence: string;
  resultStatus: string;
  valuationModel: string;
  fairnessModel: string;
  verdictModel?: string;
};

export default function AnalysisDetails({ snapshotDate, evidence, resultStatus, valuationModel, fairnessModel, verdictModel }: Props) {
  const [expanded, setExpanded] = useState(false);
  return <section className="border-t border-[var(--lcc-color-border)] pt-3" aria-label="Analysis details">
    <button type="button" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)} className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left outline-none transition hover:bg-[var(--lcc-color-surface-muted)] focus-visible:ring-2 focus-visible:ring-[var(--lcc-brand-primary)]">
      <span><span className="lcc2-label block">Analysis Details</span><span className="text-xs text-[var(--lcc-color-text-muted)]">Model and data information</span></span>
      <span aria-hidden="true" className="text-lg text-[var(--lcc-color-text-muted)]">{expanded ? "▴" : "▾"}</span>
    </button>
    {expanded ? <dl className="mt-3 grid gap-3 rounded-lg border border-[var(--lcc-color-border)] p-4 sm:grid-cols-2">
      <Field label="Data Snapshot" value={formatSnapshot(snapshotDate)} />
      <Field label="Evidence Quality" value={evidence} />
      <Field label="Result Status" value={resultStatus} />
      <Field label="Valuation Model" value={valuationModel} />
      <Field label="Fairness Model" value={fairnessModel} />
      {verdictModel ? <Field label="Trade Verdict Model" value={verdictModel} /> : null}
    </dl> : null}
  </section>;
}

function formatSnapshot(value: string) { return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }); }
function Field({ label, value }: { label: string; value: string }) { return <div><dt className="lcc2-label">{label}</dt><dd className="mt-1 font-ui text-sm font-black text-[var(--lcc-color-text)]">{value}</dd></div>; }
