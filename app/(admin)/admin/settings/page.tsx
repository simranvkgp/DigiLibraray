import { auth } from "@/lib/auth";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { getUserLanguage } from "@/lib/i18n/get-user-language";
import { translate } from "@/lib/i18n/translate";

export default async function AdminSettingsPage() {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  const lang = await getUserLanguage(userId);
  const t = (key: string) => translate(lang, key);

  return (
    <div className="p-8">
      <h1 className="font-display text-2xl font-medium text-navy">{t("nav.settings")}</h1>
      <p className="mt-1 text-sm text-text-secondary">{t("admin.settings.subtitle")}</p>
      <div className="mt-6 max-w-lg">
        <SettingsForm name={session!.user!.name ?? ""} email={session!.user!.email ?? ""} image={session!.user!.image} lang={lang} />
      </div>
    </div>
  );
}
