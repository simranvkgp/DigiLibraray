"use client";

import { BookRequestsTable } from "@/components/admin/BookRequestsTable";
import { BookSuggestionsTable } from "@/components/admin/BookSuggestionsTable";
import { translate, type Lang } from "@/lib/i18n/translate";

export function RequestsTabs({ lang = "en" }: { lang?: Lang }) {
  const t = (key: string) => translate(lang, key);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-lg font-semibold text-navy">{t("admin.requests.accessRequests")}</h2>
        <BookRequestsTable lang={lang} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-navy">{t("admin.requests.newBookRequests")}</h2>
        <BookSuggestionsTable lang={lang} />
      </section>
    </div>
  );
}
