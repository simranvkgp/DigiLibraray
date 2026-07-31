import { BookOpen, Bookmark as BookmarkIcon, Heart, ClipboardList } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserLanguage } from "@/lib/i18n/get-user-language";
import { translate } from "@/lib/i18n/translate";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { StatCard } from "@/components/ui/stat-card";
import { ContinueReadingCard } from "@/components/dashboard/ContinueReadingCard";
import { FavoriteBookListItem } from "@/components/dashboard/FavoriteBookListItem";
import { NotificationsPanel } from "@/components/dashboard/NotificationsPanel";
import { RecentlyOpenedPanel } from "@/components/dashboard/RecentlyOpenedPanel";
import { RequestBookHeroButton } from "@/components/dashboard/RequestBookHeroButton";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";

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
    booksOpenedCount,
    bookmarksCount,
    favoritesCount,
    pendingRequestsCount,
    pendingSuggestionsCount,
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
    prisma.bookAccess.count({ where: { userId } }),
    prisma.bookmark.count({ where: { userId } }),
    prisma.favorite.count({ where: { userId } }),
    prisma.bookRequest.count({ where: { userId, status: "PENDING" } }),
    prisma.bookSuggestion.count({ where: { userId, status: "PENDING" } }),
  ]);

  return (
    <div className="space-y-8">
      <DashboardHero firstName={session!.user!.name?.split(" ")[0] ?? ""} lang={lang} />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard icon={BookOpen} label={t("dashboard.booksOpened")} value={booksOpenedCount} tone="navy" />
        <StatCard
          icon={BookmarkIcon}
          label={t("dashboard.stats.bookmarks")}
          value={bookmarksCount}
          sublabel={t("dashboard.stats.bookmarksSub")}
          tone="success"
        />
        <StatCard
          icon={Heart}
          label={t("dashboard.stats.favorites")}
          value={favoritesCount}
          sublabel={t("dashboard.stats.favoritesSub")}
          tone="gold"
        />
        <StatCard
          icon={ClipboardList}
          label={t("dashboard.stats.pendingRequests")}
          value={pendingRequestsCount}
          sublabel={t("dashboard.stats.pendingRequestsSub")}
          tone="accent"
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
