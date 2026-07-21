import { signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LibraryHeroIllustration } from "@/components/auth/LibraryHeroIllustration";
import { getUserLanguage } from "@/lib/i18n/get-user-language";
import { translate } from "@/lib/i18n/translate";

const FEATURES = [
  {
    titleKey: "login.feature1Title",
    bodyKey: "login.feature1Body",
    icon: (
      <path d="M13 2 L5 13 h5 l-1 9 8-13h-5z" strokeLinejoin="round" strokeLinecap="round" />
    ),
  },
  {
    titleKey: "login.feature2Title",
    bodyKey: "login.feature2Body",
    icon: (
      <>
        <path d="M12 3 v3 M12 18 v3 M3 12 h3 M18 12 h3 M5.6 5.6 l2.1 2.1 M16.3 16.3 l2.1 2.1 M5.6 18.4 l2.1-2.1 M16.3 7.7 l2.1-2.1" strokeLinecap="round" />
        <circle cx="12" cy="12" r="3.5" />
      </>
    ),
  },
  {
    titleKey: "login.feature3Title",
    bodyKey: "login.feature3Body",
    icon: (
      <>
        <rect x="3" y="4" width="18" height="5" rx="1" />
        <path d="M5 9 v9 a1 1 0 0 0 1 1 h12 a1 1 0 0 0 1-1 V9" />
        <path d="M10 13 h4" strokeLinecap="round" />
      </>
    ),
  },
] as const;

export default async function LoginPage() {
  const lang = await getUserLanguage(undefined);
  const t = (key: string) => translate(lang, key);

  async function continueWithGoogle() {
    "use server";
    await signIn("google", { redirectTo: "/dashboard" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="grid w-full max-w-6xl grid-cols-1 overflow-hidden rounded-xl border border-border shadow-card-hover lg:grid-cols-2">
        {/* illustration panel */}
        <div className="h-64 sm:h-80 lg:h-auto lg:min-h-[640px]">
          <LibraryHeroIllustration />
        </div>

        {/* content panel */}
        <div className="flex flex-col justify-center gap-8 bg-card px-6 py-8 sm:px-10 sm:py-10 lg:px-14">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy">
                <span className="font-display text-sm font-semibold text-white">V</span>
              </div>
              <span className="font-display text-sm font-semibold text-navy">VK Digital Library</span>
            </div>
            <div className="hidden items-center gap-6 text-sm font-medium text-text-secondary sm:flex">
              <a href="/" className="transition-colors hover:text-navy">
                {t("login.navHome")}
              </a>
              <a href="#about" className="transition-colors hover:text-navy">
                {t("login.navAbout")}
              </a>
              <a href="#blog" className="transition-colors hover:text-navy">
                {t("login.navBlog")}
              </a>
            </div>
          </nav>

          <div>
            <h1 className="font-display text-4xl font-semibold leading-tight text-navy sm:text-5xl">
              {t("login.heroHeading")}
            </h1>
            <p className="mt-3 text-base text-text-secondary sm:text-lg">{t("login.heroTagline")}</p>
          </div>

          <div>
            <form action={continueWithGoogle}>
              <div className="flex items-center gap-3 rounded-full border border-border bg-background py-1.5 pl-5 pr-1.5 shadow-card">
                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" className="shrink-0">
                  <path
                    fill="#4285F4"
                    d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.85 2.09-1.81 2.73v2.27h2.92c1.7-1.57 2.69-3.88 2.69-6.64z"
                  />
                  <path
                    fill="#34A853"
                    d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.27c-.81.54-1.85.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33C2.44 15.98 5.48 18 9 18z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M3.97 10.7A5.4 5.4 0 0 1 3.68 9c0-.59.1-1.16.29-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03z"
                  />
                  <path
                    fill="#EA4335"
                    d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.97l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
                  />
                </svg>
                <span className="flex-1 truncate text-sm text-text-secondary">{t("login.subtitle")}</span>
                <Button type="submit" size="default" className="shrink-0 rounded-full">
                  {t("login.continueWithGoogle")}
                </Button>
              </div>
            </form>
            <p className="mt-3 text-xs text-text-secondary">{t("login.noSignupNote")}</p>
          </div>

          <div className="grid grid-cols-1 gap-6 border-t border-border pt-6 sm:grid-cols-3">
            {FEATURES.map((feature) => (
              <div key={feature.titleKey}>
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-accentblue/10">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--color-accentblue)"
                    strokeWidth="1.75"
                  >
                    {feature.icon}
                  </svg>
                </div>
                <h3 className="font-display text-sm font-semibold text-navy">{t(feature.titleKey)}</h3>
                <p className="mt-1 text-xs leading-relaxed text-text-secondary">{t(feature.bodyKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
