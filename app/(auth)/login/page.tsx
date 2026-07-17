import { signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { getUserLanguage } from "@/lib/i18n/get-user-language";
import { translate } from "@/lib/i18n/translate";

export default async function LoginPage() {
  const lang = await getUserLanguage(undefined);
  const t = (key: string) => translate(lang, key);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-card text-center">
        <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-navy">
          <span className="font-display text-lg font-semibold text-white">V</span>
        </div>
        <h1 className="font-display text-2xl font-semibold text-navy">VK Digital Library</h1>
        <p className="mt-2 text-sm text-text-secondary">{t("login.subtitle")}</p>

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/dashboard" });
          }}
          className="mt-6"
        >
          <Button type="submit" size="lg" className="w-full">
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path
                fill="#fff"
                d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.85 2.09-1.81 2.73v2.27h2.92c1.7-1.57 2.69-3.88 2.69-6.64z"
              />
            </svg>
            {t("login.continueWithGoogle")}
          </Button>
        </form>

        <p className="mt-6 text-xs text-text-secondary">{t("login.noSignupNote")}</p>
      </div>
    </div>
  );
}
