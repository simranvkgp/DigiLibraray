import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserLanguage } from "@/lib/i18n/get-user-language";
import { translate } from "@/lib/i18n/translate";
import { Card } from "@/components/ui/card";
import { Bookmark } from "lucide-react";

export default async function BookmarksPage() {
  const session = await auth();
  const userId = (session!.user as any).id as string;
  const lang = await getUserLanguage(userId);
  const t = (key: string) => translate(lang, key);

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId },
    include: { book: { select: { id: true, title: true, subject: true, coverImageUrl: true } } },
    orderBy: [{ bookId: "asc" }, { pageNumber: "asc" }],
  });

  const groups = new Map<string, { book: (typeof bookmarks)[number]["book"]; pages: number[] }>();
  for (const b of bookmarks) {
    const group = groups.get(b.bookId) ?? { book: b.book, pages: [] };
    group.pages.push(b.pageNumber);
    groups.set(b.bookId, group);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="font-display text-2xl font-medium text-dash-navy">{t("bookmarks.title")}</h1>
      <p className="mt-1 text-sm text-text-secondary">{t("bookmarks.subtitle")}</p>

      {groups.size === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <Bookmark size={28} className="text-text-secondary" />
          <p className="mt-3 text-sm text-text-secondary">{t("bookmarks.empty")}</p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {[...groups.entries()].map(([bookId, group]) => (
            <Card key={bookId} className="flex gap-4 p-4">
              <div className="h-24 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-background">
                {group.book.coverImageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={group.book.coverImageUrl} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-display text-base font-medium text-dash-navy">{group.book.title}</p>
                <p className="text-xs text-text-secondary">{group.book.subject}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {group.pages.map((p) => (
                    <Link
                      key={p}
                      href={`/library/${bookId}?page=${p}`}
                      className="rounded-full bg-background px-2.5 py-1 text-xs font-medium text-dash-blue hover:bg-dash-blue hover:text-white"
                    >
                      {t("reader.page")} {p}
                    </Link>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
