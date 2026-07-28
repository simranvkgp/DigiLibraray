import { auth } from "@/lib/auth";
import { getUserLanguage } from "@/lib/i18n/get-user-language";
import { translate } from "@/lib/i18n/translate";

export default async function AccountRestrictedPage() {
  const session = await auth();
  const status = (session?.user as any)?.approvalStatus;
  const userId = session?.user ? (session.user as any).id : undefined;
  const lang = await getUserLanguage(userId);
  const t = (key: string) => translate(lang, key);

  const copy = status === "SUSPENDED" ? t("accountRestricted.suspended") : t("accountRestricted.rejected");

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-card">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brandred/10">
          <span className="text-2xl">🚫</span>
        </div>
        <h1 className="font-display text-xl font-semibold text-navy">{t("accountRestricted.title")}</h1>
        <p className="mt-2 text-sm text-text-secondary">{copy}</p>
      </div>
    </div>
  );
}
