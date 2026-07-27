import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserLanguage } from "@/lib/i18n/get-user-language";
import { translate } from "@/lib/i18n/translate";
import { type AdminNavModule } from "@/components/admin/AdminSidebarNav";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  const lang = await getUserLanguage(userId);
  const t = (key: string) => translate(lang, key);
  const [pendingSuggestionCount, pendingUserCount] = await Promise.all([
    prisma.bookSuggestion.count({ where: { status: "PENDING" } }),
    prisma.user.count({ where: { approvalStatus: "PENDING" } }),
  ]);

  const modules: AdminNavModule[] = [
    { href: "/admin/dashboard", label: t("nav.dashboard"), icon: "LayoutDashboard", group: t("admin.nav.group.overview") },
    { href: "/admin/books", label: t("admin.nav.books"), icon: "BookOpen", group: t("admin.nav.group.content") },
    { href: "/admin/requests", label: t("admin.nav.requests"), icon: "Inbox", badge: pendingSuggestionCount, group: t("admin.nav.group.content") },
    { href: "/admin/book-names", label: t("admin.nav.bookNames"), icon: "ListPlus", group: t("admin.nav.group.content") },
    { href: "/admin/boards", label: t("admin.nav.boards"), icon: "GraduationCap", group: t("admin.nav.group.content") },
    { href: "/admin/categories", label: t("admin.nav.categories"), icon: "Boxes", group: t("admin.nav.group.content") },
    { href: "/admin/users", label: t("admin.nav.users"), icon: "Users", badge: pendingUserCount, group: t("admin.nav.group.people") },
    { href: "/admin/institutions", label: t("admin.nav.institutions"), icon: "Building2", group: t("admin.nav.group.people") },
    { href: "/admin/analytics", label: t("admin.nav.analytics"), icon: "BarChart3", group: t("admin.nav.group.system") },
    { href: "/admin/notifications", label: t("admin.nav.notifications"), icon: "Bell", group: t("admin.nav.group.system") },
    { href: "/admin/logs", label: t("admin.nav.logs"), icon: "ScrollText", group: t("admin.nav.group.system") },
    { href: "/admin/settings", label: t("nav.settings"), icon: "Settings", group: t("admin.nav.group.system") },
  ];

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="min-h-screen bg-dash-cream">
      <AdminSidebar
        modules={modules}
        lang={lang}
        brandLabel={t("admin.nav.brand")}
        logoutLabel={t("nav.logout")}
        onSignOut={handleSignOut}
      />
      <main className="p-4 pt-20 sm:p-6 sm:pt-20 lg:ml-60 lg:p-8 lg:pt-8">{children}</main>
    </div>
  );
}
