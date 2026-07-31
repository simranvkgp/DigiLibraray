"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { translate, type Lang } from "@/lib/i18n/translate";

export function ContinueReadingCard({
  bookId,
  title,
  coverImageUrl,
  percentComplete,
  percentLabel,
  initialIsFavorite = false,
  lang = "en",
}: {
  bookId: string;
  title: string;
  coverImageUrl: string | null;
  percentComplete?: number;
  percentLabel?: string;
  initialIsFavorite?: boolean;
  lang?: Lang;
}) {
  const t = (key: string) => translate(lang, key);
  const showProgress = percentComplete !== undefined;
  const pct = Math.max(0, Math.min(100, Math.round(percentComplete ?? 0)));
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);

  async function toggleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    setIsFavorite((v) => !v); // optimistic
    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId }),
    });
    if (res.ok) {
      const data = await res.json();
      setIsFavorite(data.isFavorite);
    }
  }

  return (
    <Link href={`/library/${bookId}`}>
      <div className="group overflow-hidden rounded-2xl border border-border bg-white shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover">
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-background">
          {coverImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverImageUrl}
              alt=""
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
          )}
          <button
            onClick={toggleFavorite}
            aria-label={t(isFavorite ? "reader.removeFavorite" : "reader.addFavorite")}
            className={`absolute right-2 top-2 rounded-full p-1.5 transition-colors ${
              isFavorite ? "bg-brandred text-white" : "bg-black/40 text-white/70 hover:bg-black/60 hover:text-white"
            }`}
          >
            <Heart size={14} fill={isFavorite ? "currentColor" : "none"} />
          </button>
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
