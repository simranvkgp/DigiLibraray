"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { translate, type Lang } from "@/lib/i18n/translate";

type FavoriteEntry = {
  bookId: string;
  pageNumber: number | null;
  book: { id: string; title: string; subject: string | null; coverImageUrl: string | null };
};

export function FavoritesStatCard({ lang = "en", count }: { lang?: Lang; count: number }) {
  const t = (key: string) => translate(lang, key);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [favorites, setFavorites] = useState<FavoriteEntry[] | null>(null);

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next && favorites === null) {
      setLoading(true);
      fetch("/api/favorites")
        .then((r) => r.json())
        .then((d) => setFavorites(d.favorites ?? []))
        .catch(() => setFavorites([]))
        .finally(() => setLoading(false));
    }
  }

  const groups = new Map<string, { book: FavoriteEntry["book"]; pages: number[] }>();
  for (const f of favorites ?? []) {
    const group = groups.get(f.bookId) ?? { book: f.book, pages: [] };
    if (f.pageNumber !== null) group.pages.push(f.pageNumber);
    groups.set(f.bookId, group);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-3 rounded-2xl border border-border bg-white p-4 text-left shadow-card transition-shadow hover:shadow-card-hover sm:gap-4 sm:p-5">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-dash-gold text-dash-navy sm:h-12 sm:w-12">
            <Heart size={20} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-sm leading-tight text-text-secondary">{t("dashboard.stats.favorites")}</p>
            <p className="font-display text-2xl font-semibold text-dash-navy">{count}</p>
            <p className="text-xs leading-tight text-text-secondary">{t("dashboard.stats.favoritesSub")}</p>
          </div>
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("dashboard.favoriteBooks")}</DialogTitle>
          <DialogDescription>{t("dashboard.stats.favoritesSub")}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-text-secondary">{t("action.loading")}</p>
        ) : groups.size === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-border p-8 text-center">
            <Heart size={28} className="text-text-secondary" />
            <p className="mt-3 text-sm text-text-secondary">{t("dashboard.emptyFavorites")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {[...groups.entries()].map(([bookId, group]) => (
              <div key={bookId} className="flex gap-3 rounded-xl border border-border p-3">
                <div className="h-20 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-background">
                  {group.book.coverImageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={group.book.coverImageUrl} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`/library/${bookId}`} onClick={() => setOpen(false)}>
                    <p className="truncate font-display text-sm font-medium text-dash-navy">{group.book.title}</p>
                  </Link>
                  <p className="truncate text-xs text-text-secondary">{group.book.subject}</p>
                  {group.pages.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {group.pages.map((p) => (
                        <Link
                          key={p}
                          href={`/library/${bookId}?page=${p}`}
                          onClick={() => setOpen(false)}
                          className="rounded-full bg-background px-2.5 py-1 text-xs font-medium text-brandred hover:bg-brandred hover:text-white"
                        >
                          {t("reader.page")} {p}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
