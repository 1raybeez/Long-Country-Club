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
          <p className="pt-1 font-ui text-xs font-black uppercase text-[var(--lcc-text-muted)]">
            {item.year}
          </p>
          <div className="relative border-l border-[var(--lcc-border)] pb-5 pl-5 last:pb-0">
            <span className="absolute -left-[0.44rem] top-1 h-3.5 w-3.5 rounded-full border-2 border-[var(--lcc-surface)] bg-[var(--lcc-gold)]" />
            <p className="font-serif text-xl font-black uppercase italic leading-none text-[var(--lcc-text)]">
              {item.title}
            </p>
            <p className="mt-2 font-ui text-sm font-medium leading-6 text-[var(--lcc-text-muted)]">
              {item.detail}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
