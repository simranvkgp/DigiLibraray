import { NamedListManager } from "@/components/admin/NamedListManager";
import { auth } from "@/lib/auth";
import { getUserLanguage } from "@/lib/i18n/get-user-language";
import { translate } from "@/lib/i18n/translate";

export default async function AdminCategoriesPage() {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  const lang = await getUserLanguage(userId);
  const t = (key: string) => translate(lang, key);

  return (
    <div className="p-8">
      <h1 className="font-display text-2xl font-medium text-navy">{t("admin.nav.categories")}</h1>
      <p className="mt-1 text-sm text-text-secondary">{t("admin.categories.subtitle")}</p>
      <div className="mt-6">
        <NamedListManager apiPath="/api/admin/categories" itemLabel={t("admin.field.category")} dataKey="categories" lang={lang} />
      </div>
    </div>
  );
}
