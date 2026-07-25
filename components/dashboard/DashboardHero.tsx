import Link from "next/link";
import { RequestBookHeroButton } from "@/components/dashboard/RequestBookHeroButton";
import { translate, type Lang } from "@/lib/i18n/translate";

export function DashboardHero({ firstName, lang = "en" }: { firstName: string; lang?: Lang }) {
  const t = (key: string) => translate(lang, key);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-dash-navy shadow-card-hover">
      <img
        src="/images/login-illustration.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 h-full w-auto max-w-[55%] object-cover object-left opacity-90"
        style={{
          WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 35%)",
          maskImage: "linear-gradient(to right, transparent 0%, black 35%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-dash-navy via-dash-navy/95 to-transparent"
      />

      <div className="relative flex flex-col gap-5 px-6 py-10 sm:px-10 sm:py-12 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-white sm:text-3xl">
            {t("dashboard.welcomeBack")}, {firstName}! 👋
          </h1>
          <p className="mt-2 max-w-md text-sm text-white/75 sm:text-base">{t("dashboard.heroSubtitle")}</p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-3">
          <RequestBookHeroButton
            lang={lang}
            triggerClassName="rounded-xl bg-dash-gold px-5 py-3 text-sm font-semibold text-dash-navy shadow-sm transition-colors hover:bg-dash-gold/90"
          />
          <Link
            href="/library"
            className="rounded-xl border border-white/30 bg-transparent px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            {t("dashboard.browseLibrary")}
          </Link>
        </div>
      </div>
    </div>
  );
}
