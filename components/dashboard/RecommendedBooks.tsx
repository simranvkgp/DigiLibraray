import Link from "next/link";
import { translate, type Lang } from "@/lib/i18n/translate";

interface RecommendedBook {
  id: string;
  title: string;
  subject: string;
  coverImageUrl: string | null;
}

export function RecommendedBooks({ books, lang = "en" }: { books: RecommendedBook[]; lang?: Lang }) {
  const t = (key: string) => translate(lang, key);

  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-medium text-dash-navy">{t("dashboard.recommended")}</h2>
        <Link href="/library" className="text-sm font-medium text-dash-blue hover:underline">
          {t("dashboard.viewAll")}
        </Link>
      </div>

      {books.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-border bg-white p-6 text-center text-sm text-text-secondary">
          {t("dashboard.emptyRecommended")}
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {books.map((book) => (
            <Link key={book.id} href={`/library/${book.id}`}>
              <div className="group overflow-hidden rounded-xl border border-border bg-white shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover">
                <div className="aspect-square w-full overflow-hidden bg-background">
                  {book.coverImageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={book.coverImageUrl}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                  )}
                </div>
                <div className="p-2.5">
                  <p className="truncate text-xs font-semibold uppercase tracking-wide text-dash-navy">{book.subject}</p>
                  <p className="truncate text-xs text-text-secondary">{book.title}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
