import { UserManagementTable } from "@/components/admin/UserManagementTable";
import { auth } from "@/lib/auth";
import { getUserLanguage } from "@/lib/i18n/get-user-language";
import { translate } from "@/lib/i18n/translate";

export default async function AdminUsersPage() {
  const session = await auth();
  const actor = session?.user as any;
  const userId = actor?.id as string | undefined;
  const lang = await getUserLanguage(userId);
  const t = (key: string) => translate(lang, key);

  return (
    <div className="p-8">
      <h1 className="font-display text-2xl font-medium text-navy">{t("admin.nav.users")}</h1>
      <p className="mt-1 text-sm text-text-secondary">{t("admin.users.subtitle")}</p>
      <div className="mt-6">
        <UserManagementTable lang={lang} canManageRoles={actor?.role === "SUPER_ADMIN"} />
      </div>
    </div>
  );
}
