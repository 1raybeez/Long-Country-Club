type TradeMeterProps = {
  readonly value: number;
  readonly label?: string;
};

export function TradeMeter({ value, label = "Trade Activity" }: TradeMeterProps) {
  const boundedValue = Math.max(0, Math.min(value, 10));
  const meterColor = getTradeMeterColor(boundedValue);
  const fillWidth = boundedValue === 0 ? 6 : boundedValue * 10;

  return (
    <div className="rounded-[var(--lcc-radius)] border border-[var(--lcc-border)] bg-[var(--lcc-surface-muted)] p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="font-ui text-xs font-black uppercase text-[var(--lcc-text-muted)]">
          {label}
        </p>
        <p className="font-serif text-base font-black uppercase italic text-[var(--lcc-text)]">
          {boundedValue}/10
        </p>
      </div>
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--lcc-border)]"
        role="meter"
        aria-label={`${label} ${boundedValue} out of 10`}
        aria-valuemin={0}
        aria-valuemax={10}
        aria-valuenow={boundedValue}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${fillWidth}%`,
            backgroundColor: meterColor,
          }}
        />
      </div>
    </div>
  );
}

function getTradeMeterColor(value: number) {
  if (value <= 3) {
    return "#b42318";
  }

  if (value <= 7) {
    return "var(--lcc-gold)";
  }

  return "#1f7a4a";
}
