"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { RequestAccessDialog } from "@/components/books/RequestAccessDialog";
import { translate, type Lang } from "@/lib/i18n/translate";
import type { BookRequestStatus } from "@/types";

export function AccessRequiredNotice({
  book,
  lang = "en",
  requestStatus,
}: {
  book: { id: string; title: string; coverImageUrl: string | null };
  lang?: Lang;
  requestStatus: BookRequestStatus;
}) {
  const t = (key: string) => translate(lang, key);

  return (
    <div className="flex min-h-dvh flex-col items-center bg-gradient-to-br from-cream to-background px-6 py-16 text-center">
      <div className="mx-auto flex w-full max-w-md flex-col items-center">
        <Card className="flex w-full flex-col items-center gap-4 p-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-navy/10 text-navy">
            <Lock size={24} />
          </div>
          <div>
            <p className="font-display text-lg font-medium text-navy">{t("library.accessRequired.title")}</p>
            <p className="mt-1 text-sm text-text-secondary">{book.title}</p>
            <p className="mt-2 text-sm text-text-secondary">{t("library.accessRequired.body")}</p>
          </div>
          <RequestAccessDialog book={book} lang={lang} requestStatus={requestStatus} />
          <Link href="/library" className="text-sm text-accentblue hover:underline">
            {t("library.accessRequired.back")}
          </Link>
        </Card>
      </div>
    </div>
  );
}
