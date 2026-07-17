import Link from "next/link";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  GraduationCap,
  Boxes,
  Building2,
  BarChart3,
  Bell,
  Settings,
  ScrollText,
} from "lucide-react";
import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { getUserLanguage } from "@/lib/i18n/get-user-language";
import { translate } from "@/lib/i18n/translate";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  const lang = await getUserLanguage(userId);
  const t = (key: string) => translate(lang, key);

  const modules = [
    { href: "/admin/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: "/admin/books", label: t("admin.nav.books"), icon: BookOpen },
    { href: "/admin/users", label: t("admin.nav.users"), icon: Users },
    { href: "/admin/boards", label: t("admin.nav.boards"), icon: GraduationCap },
    { href: "/admin/categories", label: t("admin.nav.categories"), icon: Boxes },
    { href: "/admin/institutions", label: t("admin.nav.institutions"), icon: Building2 },
    { href: "/admin/analytics", label: t("admin.nav.analytics"), icon: BarChart3 },
    { href: "/admin/notifications", label: t("admin.nav.notifications"), icon: Bell },
    { href: "/admin/settings", label: t("nav.settings"), icon: Settings },
    { href: "/admin/logs", label: t("admin.nav.logs"), icon: ScrollText },
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 flex-shrink-0 border-r border-border bg-card lg:block">
        <div className="flex h-16 items-center border-b border-border px-5">
          <span className="font-display text-lg font-semibold text-navy">{t("admin.nav.brand")}</span>
        </div>
        <nav className="space-y-1 p-3">
          {modules.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-text-secondary hover:bg-background hover:text-navy"
            >
              <m.icon size={18} />
              {m.label}
            </Link>
          ))}
        </nav>
        <div className="p-3">
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <Button variant="outline" size="sm" className="w-full" type="submit">{t("nav.logout")}</Button>
          </form>
        </div>
      </aside>
      <main className="flex-1 bg-background">{children}</main>
    </div>
  );
}
