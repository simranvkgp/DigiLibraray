import { auth } from "@/lib/auth";
import { getUserLanguage } from "@/lib/i18n/get-user-language";
import { translate } from "@/lib/i18n/translate";
import { LibraryBrowser } from "@/components/books/LibraryBrowser";

export default async function LibraryPage() {
  const session = await auth();
  const userId = (session!.user as any).id as string;
  const lang = await getUserLanguage(userId);
  const t = (key: string) => translate(lang, key);
  return (
    <div>
      <h1 className="font-display text-2xl font-medium text-dash-navy sm:text-3xl">{t("library.title")}</h1>
      <p className="mt-1.5 text-sm text-text-secondary">{t("library.subtitle")}</p>
      <div className="mt-6">
        <LibraryBrowser lang={lang} />
      </div>
    </div>
  );
}
