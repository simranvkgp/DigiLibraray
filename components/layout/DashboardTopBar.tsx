"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { translate, type Lang } from "@/lib/i18n/translate";
import type { Role } from "@/types";

export function DashboardTopBar({
  name,
  image,
  role,
  lang = "en",
  onSignOut,
}: {
  name: string;
  image?: string | null;
  role: Role;
  lang?: Lang;
  onSignOut: () => Promise<void>;
}) {
  const t = (key: string) => translate(lang, key);
  const roleLabel = t(`dashboard.roleLabel.${role.toLowerCase()}`);
  const pathname = usePathname();
  const showBackToDashboard = pathname !== "/dashboard";

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-dash-cream/95 backdrop-blur">
      <div className="flex items-center gap-2 px-3 py-3 sm:gap-4 sm:px-6 sm:py-4">
        {showBackToDashboard ? (
          <Link
            href="/dashboard"
            className="flex max-w-md flex-1 items-center gap-2 truncate text-sm font-medium text-dash-navy hover:text-dash-navy/80"
            aria-label={t("reader.backToDashboard")}
          >
            <ArrowLeft size={18} className="flex-shrink-0" />
            <span className="truncate">{t("reader.backToDashboard")}</span>
          </Link>
        ) : (
          <img
            src="/images/logo.svg"
            alt="VK Digital Library"
            className="ml-1 h-10 w-auto flex-shrink-0 sm:ml-5 sm:h-[3.25rem]"
          />
        )}

        <div className="ml-auto flex items-center gap-2 sm:gap-4">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2.5 transition-colors hover:bg-dash-navy/5">
                {image ? (
                  <Image src={image} alt={name} width={36} height={36} className="rounded-full" />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-dash-navy text-sm font-semibold text-white">
                    {name?.[0]?.toUpperCase() ?? "U"}
                  </div>
                )}
                <span className="hidden text-left sm:block">
                  <span className="block text-sm font-medium leading-tight text-dash-navy">{name}</span>
                  <span className="block text-xs leading-tight text-text-secondary">{roleLabel}</span>
                </span>
                <ChevronDown size={15} className="hidden text-text-secondary sm:block" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={8}
                className="z-50 min-w-[160px] rounded-xl border border-border bg-white p-1.5 shadow-card-hover"
              >
                <DropdownMenu.Item
                  onSelect={(e) => {
                    e.preventDefault();
                    onSignOut();
                  }}
                  className="cursor-pointer rounded-lg px-3 py-2 text-sm text-text-primary outline-none transition-colors hover:bg-background"
                >
                  {t("nav.logout")}
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>
    </header>
  );
}
