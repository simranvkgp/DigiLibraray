"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { translate, type Lang } from "@/lib/i18n/translate";

export function UserNavLinks({ lang = "en" }: { lang?: Lang }) {
  const pathname = usePathname();
  const t = (key: string) => translate(lang, key);

  const links = [
    { href: "/dashboard", label: t("nav.dashboard") },
    { href: "/library", label: t("nav.library") },
    { href: "/settings", label: t("nav.settings") },
  ];

  return (
    <nav className="hidden items-center gap-6 text-sm font-medium text-text-secondary sm:flex">
      {links.map((l) => {
        const active = pathname === l.href || pathname?.startsWith(`${l.href}/`);
        return (
          <Link key={l.href} href={l.href} className={cn("hover:text-navy", active && "font-semibold text-accentblue")}>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
