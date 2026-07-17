import { NamedListManager } from "@/components/admin/NamedListManager";
import { auth } from "@/lib/auth";
import { getUserLanguage } from "@/lib/i18n/get-user-language";
import { translate } from "@/lib/i18n/translate";

export default async function AdminBoardsPage() {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  const lang = await getUserLanguage(userId);
  const t = (key: string) => translate(lang, key);

  return (
    <div className="p-8">
      <h1 className="font-display text-2xl font-medium text-navy">{t("admin.nav.boards")}</h1>
      <p className="mt-1 text-sm text-text-secondary">{t("admin.boards.subtitle")}</p>
      <div className="mt-6">
        <NamedListManager apiPath="/api/admin/boards" itemLabel={t("admin.field.board")} dataKey="boards" lang={lang} />
      </div>
    </div>
  );
}
