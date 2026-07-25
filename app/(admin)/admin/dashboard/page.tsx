import { Users, UserCheck, BookOpen, Eye } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/ui/stat-card";
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

  return (
    <div className="min-h-full bg-dash-cream p-8">
      <div className="rounded-2xl bg-dash-navy px-6 py-8 shadow-card-hover sm:px-8">
        <h1 className="font-display text-2xl font-medium text-white">{t("nav.dashboard")}</h1>
        <p className="mt-1.5 text-sm text-white/75">{t("admin.dashboard.subtitle")}</p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Users} label={t("admin.dashboard.totalUsers")} value={totalUsers} tone="navy" />
        <StatCard
          icon={UserCheck}
          label={t("admin.dashboard.pendingApprovals")}
          value={pendingUsers}
          tone={pendingUsers > 0 ? "warning" : "success"}
        />
        <StatCard icon={BookOpen} label={t("admin.dashboard.totalBooks")} value={totalBooks} tone="accent" />
        <StatCard icon={Eye} label={t("admin.dashboard.totalViews")} value={totalViews._sum.viewCount ?? 0} tone="gold" />
      </div>
    </div>
  );
}
