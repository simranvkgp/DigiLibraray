"use client";

import Image from "next/image";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Search, ChevronDown } from "lucide-react";
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

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-dash-cream/95 backdrop-blur">
      <div className="flex items-center gap-4 py-4 pl-20 pr-6 lg:pl-6">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
          <input
            type="search"
            placeholder={t("dashboard.searchPlaceholder")}
            className="h-11 w-full rounded-xl border border-border bg-white pl-10 pr-4 text-sm placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dash-gold"
          />
        </div>

        <div className="ml-auto flex items-center gap-4">
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
