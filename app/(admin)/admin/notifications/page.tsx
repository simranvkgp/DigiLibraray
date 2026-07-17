import { NotificationComposer } from "@/components/admin/NotificationComposer";
import { auth } from "@/lib/auth";
import { getUserLanguage } from "@/lib/i18n/get-user-language";
import { translate } from "@/lib/i18n/translate";

export default async function AdminNotificationsPage() {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  const lang = await getUserLanguage(userId);
  const t = (key: string) => translate(lang, key);

  return (
    <div className="p-8">
      <h1 className="font-display text-2xl font-medium text-navy">{t("admin.nav.notifications")}</h1>
      <p className="mt-1 text-sm text-text-secondary">{t("admin.notifications.subtitle")}</p>
      <div className="mt-6">
        <NotificationComposer lang={lang} />
      </div>
    </div>
  );
}
