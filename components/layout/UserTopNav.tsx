import Image from "next/image";
import Link from "next/link";
import { signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { translate, type Lang } from "@/lib/i18n/translate";

export function UserTopNav({
  name,
  image,
  lang = "en",
}: {
  name: string;
  image?: string | null;
  lang?: Lang;
}) {
  const t = (key: string) => translate(lang, key);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/90 glass">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/dashboard" className="font-display text-lg font-semibold text-navy">
          VK Digital Library
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-text-secondary sm:flex">
          <Link href="/dashboard" className="hover:text-navy">{t("nav.dashboard")}</Link>
          <Link href="/library" className="hover:text-navy">{t("nav.library")}</Link>
          <Link href="/settings" className="hover:text-navy">{t("nav.settings")}</Link>
        </nav>
        <div className="flex items-center gap-3">
          {image ? (
            <Image src={image} alt={name} width={32} height={32} className="rounded-full" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-xs text-white">
              {name?.[0]?.toUpperCase() ?? "U"}
            </div>
          )}
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <Button variant="ghost" size="sm" type="submit">{t("nav.logout")}</Button>
          </form>
        </div>
      </div>
    </header>
  );
}
