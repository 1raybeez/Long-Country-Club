export type ProfileTimelineItem = {
  readonly year: string;
  readonly title: string;
  readonly detail: string;
};

type ProfileTimelineProps = {
  readonly items: readonly ProfileTimelineItem[];
};

export function ProfileTimeline({ items }: ProfileTimelineProps) {
  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div
          key={`${item.year}-${item.title}-${index}`}
          className="grid grid-cols-[5rem_1fr] gap-4"
        >
          <p className="pt-1 lcc2-label">
            {item.year}
          </p>
          <div className="relative border-l border-[var(--lcc-color-border)] pb-5 pl-5 last:pb-0">
            <span className="absolute -left-[0.44rem] top-1 h-3.5 w-3.5 rounded-full border-2 border-[var(--lcc-color-surface-raised)] bg-[var(--lcc-color-achievement)]" />
            <p className="font-ui text-lg font-black leading-tight text-[var(--lcc-color-text)]">
              {item.title}
            </p>
            <p className="lcc2-body mt-2">
              {item.detail}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
