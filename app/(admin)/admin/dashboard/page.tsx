import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { getUserLanguage } from "@/lib/i18n/get-user-language";
import { translate } from "@/lib/i18n/translate";

export default async function AdminDashboardPage() {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  const lang = await getUserLanguage(userId);
  const t = (key: string) => translate(lang, key);

  const [totalUsers, pendingUsers, totalBooks, totalViews] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { approvalStatus: "PENDING" } }),
    prisma.book.count(),
    prisma.book.aggregate({ _sum: { viewCount: true } }),
  ]);

  const stats = [
    { label: t("admin.dashboard.totalUsers"), value: totalUsers },
    { label: t("admin.dashboard.pendingApprovals"), value: pendingUsers, accent: pendingUsers > 0 },
    { label: t("admin.dashboard.totalBooks"), value: totalBooks },
    { label: t("admin.dashboard.totalViews"), value: totalViews._sum.viewCount ?? 0 },
  ];

  return (
    <div className="p-8">
      <h1 className="font-display text-2xl font-medium text-navy">{t("nav.dashboard")}</h1>
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-medium text-text-secondary">{s.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`data-text text-3xl font-medium ${s.accent ? "text-warning" : "text-navy"}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
