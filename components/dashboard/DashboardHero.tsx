import { RequestBookHeroButton } from "@/components/dashboard/RequestBookHeroButton";
import { translate, type Lang } from "@/lib/i18n/translate";
import { openContactPopup } from "@/lib/utils";

export function DashboardHero({ firstName, lang = "en" }: { firstName: string; lang?: Lang }) {
  const t = (key: string) => translate(lang, key);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-dash-navy shadow-card-hover">
      <div className="relative flex flex-col gap-5 px-6 py-10 sm:px-10 sm:py-12 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-white sm:text-3xl">
            {t("dashboard.welcome")}, {firstName}! 👋
          </h1>
          <p className="mt-2 max-w-md text-sm text-white/75 sm:text-base">{t("dashboard.heroSubtitle")}</p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-3">
          <RequestBookHeroButton
            lang={lang}
            triggerClassName="rounded-xl bg-dash-gold px-5 py-3 text-sm font-semibold text-dash-navy shadow-sm transition-colors hover:bg-dash-gold/90"
          />
          <button
            onClick={openContactPopup}
            className="rounded-xl border border-white/30 bg-transparent px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            {t("footer.contactUs")}
          </button>
        </div>
      </div>
    </div>
  );
}
