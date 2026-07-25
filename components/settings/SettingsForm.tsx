"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { translate, type Lang } from "@/lib/i18n/translate";

interface SettingsData {
  theme: string;
  language: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export function SettingsForm({
  name,
  email,
  image,
  lang = "en",
}: {
  name: string;
  email: string;
  image?: string | null;
  lang?: Lang;
}) {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [saving, setSaving] = useState(false);
  const { setTheme } = useTheme();
  const t = (key: string) => translate(lang, key);

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((d) => setSettings(d.settings));
  }, []);

  async function update(patch: Partial<SettingsData>) {
    setSettings((prev) => (prev ? { ...prev, ...patch } : prev));
    setSaving(true);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setSaving(false);
  }

  function handleThemeChange(nextTheme: string) {
    setTheme(nextTheme);
    update({ theme: nextTheme });
  }

  async function handleLanguageChange(nextLanguage: string) {
    await update({ language: nextLanguage });
    // Static/server-rendered text is translated per-request from the DB
    // setting, so a full reload is the simplest way to apply it everywhere.
    window.location.reload();
  }

  if (!settings) return <p className="text-sm text-text-secondary">{t("action.loading")}</p>;

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <CardHeader><CardTitle className="text-dash-navy">{t("settings.profile")}</CardTitle></CardHeader>
        <CardContent className="flex items-center gap-4">
          {image && <img src={image} alt={name} className="h-12 w-12 rounded-full" />}
          <div>
            <p className="font-medium text-dash-navy">{name}</p>
            <p className="text-sm text-text-secondary">{email}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader><CardTitle className="text-dash-navy">{t("settings.theme")}</CardTitle></CardHeader>
        <CardContent className="flex gap-2">
          {[
            { value: "light", label: t("settings.theme.light") },
            { value: "dark", label: t("settings.theme.dark") },
            { value: "system", label: t("settings.theme.system") },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleThemeChange(value)}
              className={`rounded-xl border px-4 py-2 text-sm transition-colors ${
                settings.theme === value ? "border-dash-navy bg-dash-navy text-white" : "border-border text-text-secondary hover:bg-background"
              }`}
            >
              {label}
            </button>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader><CardTitle className="text-dash-navy">{t("settings.language")}</CardTitle></CardHeader>
        <CardContent>
          <select
            value={settings.language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="h-11 rounded-xl border border-border bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dash-gold"
          >
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
          </select>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader><CardTitle className="text-dash-navy">{t("settings.notifications")}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center justify-between">
            <span className="text-sm">{t("settings.emailNotifications")}</span>
            <input
              type="checkbox"
              checked={settings.emailNotifications}
              onChange={(e) => update({ emailNotifications: e.target.checked })}
              className="h-4 w-4 accent-dash-gold"
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm">{t("settings.pushNotifications")}</span>
            <input
              type="checkbox"
              checked={settings.pushNotifications}
              onChange={(e) => update({ pushNotifications: e.target.checked })}
              className="h-4 w-4 accent-dash-gold"
            />
          </label>
        </CardContent>
      </Card>

      <p className="text-xs text-text-secondary">{saving ? t("action.saving") : t("settings.savedNote")}</p>
    </div>
  );
}
