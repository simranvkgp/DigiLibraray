"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark as BookmarkIcon } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { translate, type Lang } from "@/lib/i18n/translate";

type BookmarkEntry = {
  bookId: string;
  pageNumber: number;
  book: { id: string; title: string; subject: string | null; coverImageUrl: string | null };
};

export function BookmarksStatCard({ lang = "en", count }: { lang?: Lang; count: number }) {
  const t = (key: string) => translate(lang, key);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bookmarks, setBookmarks] = useState<BookmarkEntry[] | null>(null);

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next && bookmarks === null) {
      setLoading(true);
      fetch("/api/bookmarks")
        .then((r) => r.json())
        .then((d) => setBookmarks(d.bookmarks ?? []))
        .catch(() => setBookmarks([]))
        .finally(() => setLoading(false));
    }
  }

  const groups = new Map<string, { book: BookmarkEntry["book"]; pages: number[] }>();
  for (const b of bookmarks ?? []) {
    const group = groups.get(b.bookId) ?? { book: b.book, pages: [] };
    group.pages.push(b.pageNumber);
    groups.set(b.bookId, group);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-4 rounded-2xl border border-border bg-white p-5 text-left shadow-card transition-shadow hover:shadow-card-hover">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-success text-white">
            <BookmarkIcon size={20} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm text-text-secondary">{t("dashboard.stats.bookmarks")}</p>
            <p className="font-display text-2xl font-semibold text-dash-navy">{count}</p>
            <p className="text-xs text-text-secondary">{t("dashboard.stats.bookmarksSub")}</p>
          </div>
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("bookmarks.title")}</DialogTitle>
          <DialogDescription>{t("bookmarks.subtitle")}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-text-secondary">{t("action.loading")}</p>
        ) : groups.size === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-border p-8 text-center">
            <BookmarkIcon size={28} className="text-text-secondary" />
            <p className="mt-3 text-sm text-text-secondary">{t("bookmarks.empty")}</p>
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
                  <p className="truncate font-display text-sm font-medium text-dash-navy">{group.book.title}</p>
                  <p className="truncate text-xs text-text-secondary">{group.book.subject}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {group.pages.map((p) => (
                      <Link
                        key={p}
                        href={`/library/${bookId}?page=${p}`}
                        onClick={() => setOpen(false)}
                        className="rounded-full bg-background px-2.5 py-1 text-xs font-medium text-dash-blue hover:bg-dash-blue hover:text-white"
                      >
                        {t("reader.page")} {p}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
