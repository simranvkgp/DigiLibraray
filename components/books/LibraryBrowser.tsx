"use client";

import { useEffect, useState } from "react";
import { Search, LayoutGrid, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { BookCard } from "@/components/books/BookCard";
import { translate, type Lang } from "@/lib/i18n/translate";
import type { BookCardData } from "@/types";

export function LibraryBrowser({ lang = "en" }: { lang?: Lang }) {
  const [books, setBooks] = useState<BookCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("recent");
  const [view, setView] = useState<"grid" | "list">("grid");
  const t = (key: string) => translate(lang, key);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    const params = new URLSearchParams({ q: query, sort });
    fetch(`/api/books?${params.toString()}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => setBooks(data.books ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [query, sort]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
          <Input
            placeholder={t("library.searchPlaceholder")}
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm"
        >
          <option value="recent">{t("library.sortRecent")}</option>
          <option value="title">{t("library.sortTitle")}</option>
          <option value="popular">{t("library.sortPopular")}</option>
        </select>
        <div className="flex rounded-lg border border-border">
          <button
            onClick={() => setView("grid")}
            className={`p-2 ${view === "grid" ? "bg-navy text-white" : "text-text-secondary"} rounded-l-lg`}
            aria-label={t("library.gridView")}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setView("list")}
            className={`p-2 ${view === "list" ? "bg-navy text-white" : "text-text-secondary"} rounded-r-lg`}
            aria-label={t("library.listView")}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      <div className="mt-6">
        {loading ? (
          <SkeletonGrid />
        ) : books.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <p className="text-sm text-text-secondary">{t("library.noResults")}</p>
          </div>
        ) : (
          <div className={view === "grid" ? "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" : "space-y-3"}>
            {books.map((book) => (
              <BookCard key={book.id} book={book} view={view} lang={lang} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-4">
          <div className="aspect-[3/4] w-full rounded-md bg-background" />
          <div className="mt-3 h-3 w-3/4 rounded bg-background" />
          <div className="mt-2 h-3 w-1/2 rounded bg-background" />
        </div>
      ))}
    </div>
  );
}
