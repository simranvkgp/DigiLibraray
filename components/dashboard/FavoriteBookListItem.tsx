import Link from "next/link";

export function FavoriteBookListItem({
  bookId,
  title,
  coverImageUrl,
}: {
  bookId: string;
  title: string;
  coverImageUrl: string | null;
}) {
  return (
    <Link href={`/library/${bookId}`}>
      <div className="group flex items-center gap-4 rounded-xl border border-border bg-white p-3 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover">
        <div className="h-16 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-background">
          {coverImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverImageUrl}
              alt=""
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
          )}
        </div>
        <p className="truncate font-body text-sm font-medium text-dash-navy">{title}</p>
      </div>
    </Link>
  );
}
