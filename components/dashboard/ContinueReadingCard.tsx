import Link from "next/link";

export function ContinueReadingCard({
  bookId,
  title,
  coverImageUrl,
  percentComplete,
  percentLabel,
}: {
  bookId: string;
  title: string;
  coverImageUrl: string | null;
  percentComplete?: number;
  percentLabel?: string;
}) {
  const showProgress = percentComplete !== undefined;
  const pct = Math.max(0, Math.min(100, Math.round(percentComplete ?? 0)));

  return (
    <Link href={`/library/${bookId}`}>
      <div className="group overflow-hidden rounded-2xl border border-border bg-white shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover">
        <div className="aspect-[3/4] w-full overflow-hidden bg-background">
          {coverImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverImageUrl}
              alt=""
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
          )}
        </div>
        <div className="p-3">
          <p className="truncate font-body text-sm font-medium text-dash-navy">{title}</p>
          {showProgress && (
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-background">
                <div className="h-full rounded-full bg-dash-gold" style={{ width: `${pct}%` }} />
              </div>
              <span className="data-text text-xs text-text-secondary">{pct}{percentLabel}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
