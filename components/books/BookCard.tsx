"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark, Heart, Share2, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatReadingTime } from "@/lib/utils";
import { translate, type Lang } from "@/lib/i18n/translate";
import { RequestAccessDialog } from "@/components/books/RequestAccessDialog";
import type { BookCardData, BookRequestStatus } from "@/types";

export function BookCard({
  book,
  view = "grid",
  lang = "en",
}: {
  book: BookCardData;
  view?: "grid" | "list";
  lang?: Lang;
}) {
  const isList = view === "list";
  const [isFavorite, setIsFavorite] = useState(!!book.isFavorite);
  const [copied, setCopied] = useState(false);
  const [requestStatus, setRequestStatus] = useState<BookRequestStatus>(book.requestStatus);
  const t = (key: string) => translate(lang, key);

  async function toggleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    setIsFavorite((v) => !v); // optimistic
    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId: book.id }),
    });
    if (res.ok) {
      const data = await res.json();
      setIsFavorite(data.isFavorite);
    }
  }

  async function share(e: React.MouseEvent) {
    e.preventDefault();
    const url = `${window.location.origin}/library/${book.id}`;
    if (navigator.share) {
      navigator.share({ title: book.title, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }

  return (
    <Card
      className={cn(
        "rounded-2xl transition-all duration-200 hover:-translate-y-1",
        isList ? "flex gap-4 p-4" : "flex flex-col p-4"
      )}
    >
      <div
        className={
          isList
            ? "h-28 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-background"
            : "aspect-[3/4] w-full overflow-hidden rounded-lg bg-background"
        }
      >
        {book.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={book.coverImageUrl} alt="" className="h-full w-full object-cover" />
        )}
      </div>

      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-display text-base font-medium leading-tight text-dash-navy">{book.title}</p>
            <p className="mt-0.5 text-xs text-text-secondary">{book.subject}{book.className ? ` · ${book.className}` : ""}</p>
          </div>
          <div className="flex gap-1 text-text-secondary">
            <Link href={`/library/${book.id}`} aria-label={t("bookCard.openToBookmark")} className="rounded p-1 hover:bg-background hover:text-dash-navy">
              <Bookmark size={16} />
            </Link>
            <button aria-label={t("bookCard.favorite")} onClick={toggleFavorite} className={`rounded p-1 hover:bg-background ${isFavorite ? "text-brandred" : "hover:text-brandred"}`}>
              <Heart size={16} fill={isFavorite ? "currentColor" : "none"} />
            </button>
            <button aria-label={t("bookCard.share")} onClick={share} className="relative rounded p-1 hover:bg-background hover:text-dash-blue">
              <Share2 size={16} />
              {copied && (
                <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-dash-navy px-2 py-0.5 text-[10px] text-white">
                  {t("bookCard.linkCopied")}
                </span>
              )}
            </button>
          </div>
        </div>

        {book.description && (
          <p className="mt-2 line-clamp-2 text-sm text-text-secondary">{book.description}</p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge variant="default">{book.boardName}</Badge>
          <Badge variant="outline">{book.categoryName}</Badge>
          <Badge variant="accent">v{book.version}</Badge>
          {book.pageCount && <Badge variant="outline">{book.pageCount}p</Badge>}
          {book.readingTimeMinutes && <Badge variant="outline">{formatReadingTime(book.readingTimeMinutes)}</Badge>}
          {!book.hasAccess && (
            <Badge variant="warning" className="gap-1">
              <Lock size={10} />
              {t("library.locked")}
            </Badge>
          )}
        </div>

        {book.hasAccess ? (
          <Link
            href={`/library/${book.id}`}
            className="mt-3 inline-flex w-fit items-center justify-center rounded-xl bg-dash-navy px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-dash-navy/90"
          >
            {t("bookCard.open")}
          </Link>
        ) : (
          <RequestAccessDialog
            book={{ id: book.id, title: book.title }}
            lang={lang}
            requestStatus={requestStatus}
            onChange={setRequestStatus}
          />
        )}
      </div>
    </Card>
  );
}
