import Link from "next/link";
import { Library, ClipboardList } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserLanguage } from "@/lib/i18n/get-user-language";
import { translate } from "@/lib/i18n/translate";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { BookmarksStatCard } from "@/components/dashboard/BookmarksStatCard";
import { FavoritesStatCard } from "@/components/dashboard/FavoritesStatCard";
import { SettingsStatCard } from "@/components/dashboard/SettingsStatCard";
import { ContinueReadingCard } from "@/components/dashboard/ContinueReadingCard";
import { FavoriteBookListItem } from "@/components/dashboard/FavoriteBookListItem";
import { NotificationsPanel } from "@/components/dashboard/NotificationsPanel";
import { RecentlyOpenedPanel } from "@/components/dashboard/RecentlyOpenedPanel";
import { RequestBookHeroButton } from "@/components/dashboard/RequestBookHeroButton";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";

// Secondary and Senior Secondary are a switchable group; University is
// permanent. Keep in sync with app/api/category/route.ts.
const SWITCHABLE_SLUGS = ["secondary", "senior-secondary"];

export default async function DashboardPage() {
  const session = await auth();
  const user = session!.user as any;
  const userId = user.id as string;
  const lang = await getUserLanguage(userId);
  const t = (key: string) => translate(lang, key);

  const [
    continueReading,
    favorites,
    notifications,
    bookmarksCount,
    favoritesCount,
    pendingRequestsCount,
    pendingSuggestionsCount,
    userWithCategory,
  ] = await Promise.all([
    prisma.readingProgress.findMany({
      where: { userId },
      include: { book: true },
      orderBy: { lastReadAt: "desc" },
      take: 4,
    }),
    prisma.favorite.findMany({ where: { userId }, include: { book: true }, take: 4 }),
    prisma.notificationRecipient.findMany({
      where: { userId },
      include: { notification: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.bookmark.count({ where: { userId } }),
    prisma.favorite.count({ where: { userId } }),
    prisma.bookRequest.count({ where: { userId, status: "PENDING" } }),
    prisma.bookSuggestion.count({ where: { userId, status: "PENDING" } }),
    prisma.user.findUnique({ where: { id: userId }, include: { category: true } }),
  ]);
  const canSwitchCategory = userWithCategory?.category
    ? SWITCHABLE_SLUGS.includes(userWithCategory.category.slug)
    : false;

  return (
    <div className="space-y-8">
      <DashboardHero firstName={session!.user!.name?.split(" ")[0] ?? ""} lang={lang} />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Link
          href="/library"
          className="flex items-center gap-4 rounded-2xl border border-border bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover"
        >
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-dash-navy text-white">
            <Library size={20} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="font-display text-xl font-semibold text-dash-navy">{t("dashboard.sidebar.myLibrary")}</p>
            <p className="text-xs text-text-secondary">{t("dashboard.stats.myLibrarySub")}</p>
          </div>
        </Link>
        <BookmarksStatCard lang={lang} count={bookmarksCount} />
        <FavoritesStatCard lang={lang} count={favoritesCount} />
        <RequestBookHeroButton
          lang={lang}
          triggerClassName="flex items-center gap-4 rounded-2xl border border-border bg-white p-5 text-left shadow-card transition-shadow hover:shadow-card-hover"
        >
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-dash-blue text-white">
            <ClipboardList size={20} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm text-text-secondary">{t("dashboard.stats.pendingRequests")}</p>
            <p className="font-display text-2xl font-semibold text-dash-navy">{pendingRequestsCount}</p>
            <p className="text-xs text-text-secondary">{t("dashboard.stats.pendingRequestsSub")}</p>
          </div>
        </RequestBookHeroButton>
        <SettingsStatCard
          lang={lang}
          name={session!.user!.name ?? ""}
          email={session!.user!.email ?? ""}
          image={session!.user!.image}
          categoryName={userWithCategory?.category?.name ?? null}
          canSwitchCategory={canSwitchCategory}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          {continueReading.length === 0 && favorites.length === 0 ? (
            <Card className="border-dashed p-10 text-center">
              <p className="text-sm text-text-secondary">
                {pendingSuggestionsCount > 0 ? t("dashboard.newUser.pendingRequestMessage") : t("dashboard.newUser.message")}
              </p>
              <div className="mt-4 flex items-center justify-center gap-3">
                <RequestBookHeroButton
                  lang={lang}
                  triggerClassName="rounded-lg bg-dash-navy px-4 py-2 text-sm font-medium text-white hover:bg-dash-navy/90"
                />
              </div>
            </Card>
          ) : (
            <section>
              <SectionLabel>{t("dashboard.continueReading")}</SectionLabel>
              {continueReading.length === 0 ? (
                <p className="mt-4 text-sm text-text-secondary">{t("dashboard.emptyContinueReading")}</p>
              ) : (
                <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {continueReading.map((rp) => (
                    <ContinueReadingCard
                      key={rp.id}
                      bookId={rp.bookId}
                      title={rp.book.title}
                      coverImageUrl={rp.book.coverImageUrl}
                      percentComplete={rp.percentComplete}
                      percentLabel={t("dashboard.percentComplete")}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {(continueReading.length > 0 || favorites.length > 0) && (
            <section>
              <SectionLabel>{t("dashboard.favoriteBooks")}</SectionLabel>
              {favorites.length === 0 ? (
                <p className="mt-4 text-sm text-text-secondary">{t("dashboard.emptyFavorites")}</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {favorites.map((f) => (
                    <FavoriteBookListItem key={f.id} bookId={f.bookId} title={f.book.title} coverImageUrl={f.book.coverImageUrl} />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        <div className="space-y-6">
          <NotificationsPanel
            lang={lang}
            items={notifications.map((n) => ({
              id: n.id,
              type: n.notification.type,
              title: n.notification.title,
              body: n.notification.body,
              createdAt: n.notification.createdAt,
              readAt: n.readAt,
            }))}
          />
          <RecentlyOpenedPanel
            lang={lang}
            items={continueReading.map((rp) => ({
              bookId: rp.bookId,
              title: rp.book.title,
              coverImageUrl: rp.book.coverImageUrl,
              lastReadAt: rp.lastReadAt,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
