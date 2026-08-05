"use client";

import { useState } from "react";
import Link from "next/link";
import { Settings } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { translate, type Lang } from "@/lib/i18n/translate";

export function SettingsStatCard({
  lang = "en",
  name,
  email,
  image,
  categoryName,
  canSwitchCategory,
}: {
  lang?: Lang;
  name: string;
  email: string;
  image?: string | null;
  categoryName: string | null;
  canSwitchCategory: boolean;
}) {
  const t = (key: string) => translate(lang, key);
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-3 rounded-2xl border border-border bg-white p-4 text-left shadow-card transition-shadow hover:shadow-card-hover sm:gap-4 sm:p-5">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-warning text-white sm:h-12 sm:w-12">
            <Settings size={20} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="font-display text-2xl font-semibold leading-tight text-dash-navy">
              {t("dashboard.sidebar.settings")}
            </p>
            <p className="text-xs leading-tight text-text-secondary">{t("dashboard.stats.settingsSub")}</p>
          </div>
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("settings.title")}</DialogTitle>
        </DialogHeader>

        <SettingsForm name={name} email={email} image={image} lang={lang} />

        <Card className="mt-6 p-6">
          <h2 className="font-display text-lg font-medium text-dash-navy">{t("settings.category")}</h2>
          <p className="mt-1 text-sm text-text-secondary">
            {t("settings.category.currentPrefix")}{" "}
            <strong>{categoryName ?? t("settings.category.noneYet")}</strong>.{" "}
            {canSwitchCategory ? t("settings.category.switchable") : t("settings.category.sealed")}
          </p>
          {canSwitchCategory && (
            <Link
              href="/category"
              onClick={() => setOpen(false)}
              className="mt-3 inline-block text-sm font-medium text-dash-blue underline"
            >
              {t("settings.category.change")}
            </Link>
          )}
        </Card>
      </DialogContent>
    </Dialog>
  );
}
