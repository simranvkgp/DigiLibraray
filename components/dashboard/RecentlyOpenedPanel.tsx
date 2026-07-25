import Link from "next/link";
import { translate, type Lang } from "@/lib/i18n/translate";
import { formatRelativeTime } from "@/lib/utils";

interface RecentItem {
  bookId: string;
  title: string;
  coverImageUrl: string | null;
  lastReadAt: Date | string;
}

export function RecentlyOpenedPanel({ items, lang = "en" }: { items: RecentItem[]; lang?: Lang }) {
  const t = (key: string) => translate(lang, key);

  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-card">
      <h2 className="font-display text-base font-medium text-dash-navy">{t("dashboard.recentlyOpened")}</h2>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-text-secondary">{t("dashboard.emptyRecentlyOpened")}</p>
      ) : (
        <div className="mt-3 space-y-1">
          {items.map((item) => (
            <Link
              key={item.bookId}
              href={`/library/${item.bookId}`}
              className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-background"
            >
              <div className="h-11 w-9 flex-shrink-0 overflow-hidden rounded-md bg-background">
                {item.coverImageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.coverImageUrl} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-dash-navy">{item.title}</p>
                <p className="text-xs text-text-secondary">{formatRelativeTime(item.lastReadAt)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
