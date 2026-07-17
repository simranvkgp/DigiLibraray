import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserLanguage } from "@/lib/i18n/get-user-language";
import { translate } from "@/lib/i18n/translate";
import { UserTopNav } from "@/components/layout/UserTopNav";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { Card } from "@/components/ui/card";

// Secondary and Senior Secondary are a switchable group; University is
// permanent. Keep in sync with app/api/category/route.ts.
const SWITCHABLE_SLUGS = ["secondary", "senior-secondary"];

export default async function SettingsPage() {
  const session = await auth();
  const userId = (session!.user as any).id as string;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { category: true },
  });
  const canSwitchCategory = user?.category ? SWITCHABLE_SLUGS.includes(user.category.slug) : false;
  const lang = await getUserLanguage(userId);
  const t = (key: string) => translate(lang, key);

  return (
    <div>
      <UserTopNav name={session!.user!.name ?? ""} image={session!.user!.image} lang={lang} />
      <main className="mx-auto max-w-2xl px-6 py-8">
        <h1 className="font-display text-2xl font-medium text-navy">{t("settings.title")}</h1>
        <div className="mt-6">
          <SettingsForm
            name={session!.user!.name ?? ""}
            email={session!.user!.email ?? ""}
            image={session!.user!.image}
            lang={lang}
          />
        </div>

        <Card className="mt-6 p-6">
          <h2 className="font-display text-lg font-medium text-navy">{t("settings.category")}</h2>
          <p className="mt-1 text-sm text-text-secondary">
            {t("settings.category.currentPrefix")}{" "}
            <strong>{user?.category?.name ?? t("settings.category.noneYet")}</strong>.{" "}
            {canSwitchCategory ? t("settings.category.switchable") : t("settings.category.sealed")}
          </p>
          {canSwitchCategory && (
            <Link href="/category" className="mt-3 inline-block text-sm font-medium text-navy underline">
              {t("settings.category.change")}
            </Link>
          )}
        </Card>
      </main>
    </div>
  );
}
