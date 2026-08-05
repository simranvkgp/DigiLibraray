"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { translate, type Lang } from "@/lib/i18n/translate";

export function UserNavLinks({
  lang = "en",
  className,
  onNavigate,
}: {
  lang?: Lang;
  className?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const t = (key: string) => translate(lang, key);

  const links = [
    { href: "/dashboard", label: t("nav.dashboard") },
    { href: "/library", label: t("nav.library") },
    { href: "/bookmarks", label: t("nav.bookmarks") },
    { href: "/settings", label: t("nav.settings") },
  ];

  return (
    <nav className={cn("items-center gap-6 text-sm font-medium text-text-secondary", className)}>
      {links.map((l) => {
        const active = pathname === l.href || pathname?.startsWith(`${l.href}/`);
        return (
          <Link
            key={l.href}
            href={l.href}
            onClick={onNavigate}
            className={cn(
              "block w-full rounded-lg px-3 py-2 hover:bg-dash-navy/5 hover:text-navy sm:w-auto sm:px-0 sm:py-0 sm:hover:bg-transparent",
              active && "font-semibold text-accentblue"
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
