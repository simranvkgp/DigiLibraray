import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserLanguage } from "@/lib/i18n/get-user-language";
import { translate } from "@/lib/i18n/translate";
import { UserTopNav } from "@/components/layout/UserTopNav";
import { NotificationTicker } from "@/components/dashboard/NotificationTicker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime, notificationBadgeVariant } from "@/lib/utils";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  const userId = (session!.user as any).id as string;
  const lang = await getUserLanguage(userId);
  const t = (key: string) => translate(lang, key);

  const [continueReading, favorites, notifications, stats] = await Promise.all([
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
  ]);

  return (
    <div>
      <UserTopNav name={session!.user!.name ?? ""} image={session!.user!.image} lang={lang} />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <Card className="bg-navy text-white shadow-card-hover">
          <CardContent className="flex items-center justify-between py-8">
            <div>
              <h1 className="font-display text-2xl font-medium text-white">
                {t("dashboard.welcomeBack")}, {session!.user!.name?.split(" ")[0]} 👋
              </h1>
              <p className="mt-1 text-sm text-white/70">{t("dashboard.heroSubtitle")}</p>
            </div>
            <Link href="/library">
              <span className="rounded-lg bg-card px-4 py-2 text-sm font-medium text-navy hover:bg-card/90">
                {t("dashboard.browseLibrary")}
              </span>
            </Link>
          </CardContent>
        </Card>

        <NotificationTicker
          label={t("dashboard.newUpdates")}
          items={notifications
            .filter((n) => !n.readAt)
            .map((n) => ({ id: n.id, title: n.notification.title, type: n.notification.type }))}
        />

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <section>
              <h2 className="mb-3 font-display text-lg font-medium text-navy">{t("dashboard.continueReading")}</h2>
              {continueReading.length === 0 ? (
                <EmptyState message={t("dashboard.emptyContinueReading")} />
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {continueReading.map((rp) => (
                    <Link key={rp.id} href={`/library/${rp.bookId}`}>
                      <Card className="p-3">
                        <div className="aspect-[3/4] w-full overflow-hidden rounded-md bg-background">
                          {rp.book.coverImageUrl && (
                            <img
                              src={rp.book.coverImageUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <p className="mt-2 truncate font-body text-sm font-medium">{rp.book.title}</p>
                        <p className="data-text text-xs text-text-secondary">{Math.round(rp.percentComplete)}{t("dashboard.percentComplete")}</p>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-3 font-display text-lg font-medium text-navy">{t("dashboard.favoriteBooks")}</h2>
              {favorites.length === 0 ? (
                <EmptyState message={t("dashboard.emptyFavorites")} />
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {favorites.map((f) => (
                    <Link key={f.id} href={`/library/${f.bookId}`}>
                      <Card className="p-3">
                        <div className="aspect-[3/4] w-full overflow-hidden rounded-md bg-background">
                          {f.book.coverImageUrl && (
                            <img
                              src={f.book.coverImageUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <p className="mt-2 truncate font-body text-sm font-medium">{f.book.title}</p>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>{t("dashboard.statistics")}</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">{t("dashboard.booksOpened")}</span>
                  <span className="data-text text-lg font-medium text-navy">{stats}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>{t("dashboard.notifications")}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {notifications.length === 0 && <p className="text-sm text-text-secondary">{t("dashboard.noNotifications")}</p>}
                {notifications.map((n) => (
                  <div key={n.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant={notificationBadgeVariant(n.notification.type)}>
                        {n.notification.type.replace("_", " ")}
                      </Badge>
                      <span className="shrink-0 text-xs text-text-secondary">
                        {formatRelativeTime(n.notification.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1.5 flex items-center gap-1.5 truncate font-body text-sm font-medium">
                      {!n.readAt && <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-accentblue" />}
                      <span className="truncate">{n.notification.title}</span>
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-text-secondary">{n.notification.body}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card className="border-dashed p-8 text-center">
      <p className="text-sm text-text-secondary">{message}</p>
    </Card>
  );
}
