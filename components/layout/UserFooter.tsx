import { Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { translate, type Lang } from "@/lib/i18n/translate";
import { GMAIL_COMPOSE_URL } from "@/lib/utils";

export function UserFooter({ lang = "en" }: { lang?: Lang }) {
  const t = (key: string) => translate(lang, key);
  return (
    <footer className="pb-2 pt-2">
      <Card className="relative overflow-hidden rounded-2xl border-none bg-dash-navy text-white shadow-card-hover">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-12 -left-10 h-44 w-44 rounded-full bg-white/8"
        />
        <CardContent className="relative flex flex-col items-center justify-between gap-4 py-6 sm:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/10">
              <Mail size={18} className="text-dash-gold" aria-hidden="true" />
            </div>
            <p className="text-sm text-white/80">&copy; {new Date().getFullYear()} VK Global Group</p>
          </div>
          <a
            href={GMAIL_COMPOSE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-dash-gold px-4 py-2.5 text-sm font-semibold text-dash-navy transition-colors hover:bg-dash-gold/90"
          >
            <Mail size={16} />
            {t("footer.contactUs")}
          </a>
        </CardContent>
      </Card>
    </footer>
  );
}
