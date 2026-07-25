"use client";

import { BookSuggestionsTable } from "@/components/admin/BookSuggestionsTable";
import { type Lang } from "@/lib/i18n/translate";

export function RequestsTabs({ lang = "en" }: { lang?: Lang }) {
  return <BookSuggestionsTable lang={lang} />;
}
