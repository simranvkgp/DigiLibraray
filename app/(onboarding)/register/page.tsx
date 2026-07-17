import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RegistrationForm } from "@/components/onboarding/RegistrationForm";
import { getUserLanguage } from "@/lib/i18n/get-user-language";
import { translate } from "@/lib/i18n/translate";

export default async function RegisterPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = (session.user as any).id as string;
  const lang = await getUserLanguage(userId);
  const t = (key: string) => translate(lang, key);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-8 shadow-card">
        <h1 className="font-display text-2xl font-semibold text-navy">{t("register.title")}</h1>
        <p className="mt-1.5 text-sm text-text-secondary">{t("register.subtitle")}</p>
        <div className="mt-6">
          <RegistrationForm name={session.user.name ?? ""} email={session.user.email ?? ""} lang={lang} />
        </div>
      </div>
    </div>
  );
}
