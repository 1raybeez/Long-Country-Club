import { getTeamBranding } from "@/lib/teamBranding";

type TeamBadgeProps = {
  readonly value?: string;
  readonly label?: string;
  readonly className?: string;
};

export function TeamBadge({ value, label, className }: TeamBadgeProps) {
  if (!value) {
    return null;
  }

  const team = getTeamBranding(value);
  const displayName = team?.displayName ?? value;
  const metaLabel =
    team?.type === "college" ? "College" : team?.type === "nfl" ? "NFL" : "Club";

  if (team) {
    const textColor = team.textColor ?? getReadableTextColor(team.primaryColor);
    const submittedValue = value.trim().toUpperCase();
    const shouldShowSubmittedValue =
      submittedValue !== team.shortName.toUpperCase() &&
      submittedValue !== team.displayName.toUpperCase();

    return (
      <div
        className={[
          "rounded-[var(--lcc-radius)] border p-3",
          className ?? "",
        ].join(" ")}
        style={{
          backgroundColor: team.primaryColor,
          borderColor: team.secondaryColor,
          boxShadow: `inset 0 0 0 1px ${team.secondaryColor}80`,
          color: textColor,
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <p
            className="font-ui text-xs font-black uppercase"
            style={{ color: textColor, opacity: 0.82 }}
          >
            {label ?? metaLabel}
          </p>
          <span
            className="h-1.5 w-10 shrink-0 rounded-full"
            style={{ backgroundColor: team.secondaryColor }}
            aria-hidden="true"
          />
        </div>
        <p
          className="mt-1.5 font-serif text-base font-black uppercase italic leading-tight"
          style={{ color: textColor }}
        >
          {displayName}
        </p>
        {shouldShowSubmittedValue && (
          <p
            className="mt-1 font-ui text-[0.65rem] font-black uppercase"
            style={{ color: textColor, opacity: 0.78 }}
          >
            {value}
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      className={[
        "rounded-[var(--lcc-radius)] border bg-[var(--lcc-surface-muted)] p-3 text-[var(--lcc-text)]",
        className ?? "",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-ui text-xs font-black uppercase text-[var(--lcc-text-muted)]">
          {label ?? metaLabel}
        </p>
        <span className="h-1.5 w-10 shrink-0 rounded-full bg-[var(--lcc-gold)]" />
      </div>
      <p className="mt-1.5 font-serif text-base font-black uppercase italic leading-tight text-[var(--lcc-text)]">
        {displayName}
      </p>
    </div>
  );
}

function getReadableTextColor(hexColor: string) {
  const rgb = hexToRgb(hexColor);

  if (!rgb) {
    return "#FFFFFF";
  }

  const [red, green, blue] = rgb.map((channel) => {
    const normalized = channel / 255;

    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;

  return luminance > 0.45 ? "#101820" : "#FFFFFF";
}

function hexToRgb(hexColor: string) {
  const normalizedHex = hexColor.replace("#", "");

  if (!/^[0-9a-f]{6}$/i.test(normalizedHex)) {
    return undefined;
  }

  return [
    Number.parseInt(normalizedHex.slice(0, 2), 16),
    Number.parseInt(normalizedHex.slice(2, 4), 16),
    Number.parseInt(normalizedHex.slice(4, 6), 16),
  ];
}
