"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FavoriteBookListItem } from "@/components/dashboard/FavoriteBookListItem";
import { translate, type Lang } from "@/lib/i18n/translate";

type FavoriteEntry = {
  bookId: string;
  book: { id: string; title: string; coverImageUrl: string | null };
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-4 rounded-2xl border border-border bg-white p-5 text-left shadow-card transition-shadow hover:shadow-card-hover">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-dash-gold text-dash-navy">
            <Heart size={20} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm text-text-secondary">{t("dashboard.stats.favorites")}</p>
            <p className="font-display text-2xl font-semibold text-dash-navy">{count}</p>
            <p className="text-xs text-text-secondary">{t("dashboard.stats.favoritesSub")}</p>
          </div>
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("dashboard.favoriteBooks")}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-text-secondary">{t("action.loading")}</p>
        ) : !favorites || favorites.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-border p-8 text-center">
            <Heart size={28} className="text-text-secondary" />
            <p className="mt-3 text-sm text-text-secondary">{t("dashboard.emptyFavorites")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {favorites.map((f) => (
              <FavoriteBookListItem key={f.bookId} bookId={f.bookId} title={f.book.title} coverImageUrl={f.book.coverImageUrl} />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
