import { Zap, Sparkles, Library } from "lucide-react";
import { signIn } from "@/lib/auth";
import { AnimatedHeadline } from "@/components/auth/AnimatedHeadline";
import { FadeInUp } from "@/components/auth/FadeInUp";
import { getUserLanguage } from "@/lib/i18n/get-user-language";
import { translate } from "@/lib/i18n/translate";

const FEATURE_ICONS = [Zap, Sparkles, Library];
const FEATURE_KEYS = ["instant", "smart", "archives"] as const;

export default async function LoginPage() {
  const lang = await getUserLanguage(undefined);
  const t = (key: string) => translate(lang, key);

  async function handleSignIn() {
    "use server";
    await signIn("google", { redirectTo: "/dashboard" });
  }

  return (
    <div className="min-h-dvh border-r-[10px] border-t-[10px] border-navy bg-cream">
      <main className="mx-auto grid min-h-dvh max-w-[1920px] lg:grid-cols-[7fr_5fr]">
        <div className="hidden overflow-hidden lg:block">
          <img
            src="/images/login-illustration.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none h-full w-full object-cover object-left"
            style={{
              WebkitMaskImage: "linear-gradient(to right, black 80%, transparent 100%)",
              maskImage: "linear-gradient(to right, black 80%, transparent 100%)",
            }}
          />
        </div>

        <div className="flex items-start justify-center px-6 py-12 sm:px-10 lg:items-center lg:justify-start lg:pl-6 lg:pr-6 xl:pl-8 xl:pr-8">
          <div className="w-full max-w-[560px] p-8 sm:p-10">
            <img src="/images/logo.svg" alt="VK Digital Library" className="mb-8 h-[61px] w-auto" />
            <AnimatedHeadline
              text="VK Digital Library"
              className="text-4xl leading-tight sm:text-5xl"
            />
            <FadeInUp delay={0.15}>
              <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-accentblue sm:text-base">
                {t("login.tagline")}
              </p>
            </FadeInUp>

            <FadeInUp delay={0.2} className="mt-4">
              <p className="text-sm leading-relaxed text-text-secondary sm:text-base">
                {t("login.subtitle")}
              </p>
              <form action={handleSignIn} className="mt-5">
                <button
                  type="submit"
                  className="inline-flex items-center gap-3 rounded-full bg-navy px-8 py-4 text-base font-semibold text-white shadow-lg transition-colors hover:bg-navy/90"
                >
                  <svg width="20" height="20" viewBox="0 0 18 18" aria-hidden="true">
                    <path
                      fill="#fff"
                      d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.85 2.09-1.81 2.73v2.27h2.92c1.7-1.57 2.69-3.88 2.69-6.64z"
                    />
                    <path
                      fill="#fff"
                      d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.27c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.34C2.44 15.98 5.48 18 9 18z"
                    />
                    <path
                      fill="#fff"
                      d="M3.97 10.7c-.18-.54-.28-1.11-.28-1.7s.1-1.16.28-1.7V4.96H.96A8.996 8.996 0 000 9c0 1.45.35 2.83.96 4.04l3.01-2.34z"
                    />
                    <path
                      fill="#fff"
                      d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.59-2.59C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.96l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58z"
                    />
                  </svg>
                  {t("login.continueWithGoogle")}
                </button>
              </form>
              <p className="mt-3 text-xs text-text-secondary">{t("login.noSignupNote")}</p>
            </FadeInUp>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {FEATURE_KEYS.map((key, i) => {
                const Icon = FEATURE_ICONS[i];
                return (
                  <FadeInUp key={key} delay={0.25 + i * 0.08}>
                    <div className="group rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-card/80 hover:shadow-card-hover">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
                        <Icon className="h-5 w-5" aria-hidden="true" strokeWidth={1.75} />
                      </div>
                      <h3 className="mt-3 text-sm font-semibold text-navy">
                        {t(`login.features.${key}.title`)}
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                        {t(`login.features.${key}.desc`)}
                      </p>
                    </div>
                  </FadeInUp>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
