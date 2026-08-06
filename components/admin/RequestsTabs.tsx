"use client";

import { BookRequestsTable } from "@/components/admin/BookRequestsTable";
import { type Lang } from "@/lib/i18n/translate";

export function RequestsTabs({ lang = "en" }: { lang?: Lang }) {
  return <BookRequestsTable lang={lang} />;
}
