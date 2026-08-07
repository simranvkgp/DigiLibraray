"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { formatRelativeTime } from "@/lib/utils";
import { translate, type Lang } from "@/lib/i18n/translate";
import { useBookRequests, statusVariant, accessRequestStatusVariant } from "@/components/dashboard/useBookRequests";

const defaultTriggerClassName =
  "rounded-lg border border-white/40 px-4 py-2 text-sm font-medium text-white hover:bg-white/10";

export function RequestBookHeroButton({
  lang = "en",
  triggerClassName,
  children,
  showForm = true,
}: {
  lang?: Lang;
  triggerClassName?: string;
  children?: React.ReactNode;
  showForm?: boolean;
}) {
  const t = (key: string) => translate(lang, key);
  const [open, setOpen] = useState(false);
  const {
    suggestions,
    accessRequests,
    bookNames,
    searchBookNames,
    error,
    register,
    setValue,
    handleSubmit,
    isSubmitting,
    onSubmit,
    hasPendingSuggestion,
  } = useBookRequests();
  const [filter, setFilter] = useState("");
  const [debounceTimer, setDebounceTimer] = useState<number | null>(null);
  const [selectedTitle, setSelectedTitle] = useState("");

  const mediumOptions = Array.from(
    new Set(
      bookNames
        .filter((b) => b.name === selectedTitle)
        .map((b) => b.medium)
        .filter((m): m is string => !!m)
    )
  );

  // Load initial list when dialog opens
  function onOpenChange(open: boolean) {
    setOpen(open);
    if (open) searchBookNames("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <button className={triggerClassName ?? defaultTriggerClassName}>
          {children ?? (hasPendingSuggestion ? t("dashboard.requestBook.pendingButton") : t("dashboard.requestBook.button"))}
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{showForm ? t("dashboard.requestBook.dialogTitle") : t("dashboard.requestBook.viewTitle")}</DialogTitle>
          {showForm && <DialogDescription>{t("dashboard.requestBook.subtitle")}</DialogDescription>}
        </DialogHeader>

        {showForm && (bookNames.length === 0 ? (
          <p className="text-sm text-text-secondary">{t("dashboard.requestBook.noBooksAvailable")}</p>
        ) : (
          <form
            onSubmit={handleSubmit((data) =>
              onSubmit(data, () => {
                setOpen(false);
              })
            )}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="hb-search">Search</Label>
              <input
                id="hb-search"
                value={filter}
                onChange={(e) => {
                  const v = e.target.value;
                  setFilter(v);
                  if (debounceTimer) window.clearTimeout(debounceTimer);
                  const tId = window.setTimeout(() => searchBookNames(v), 250);
                  setDebounceTimer(tId);
                }}
                placeholder={t("dashboard.requestBook.searchPlaceholder")}
                className="mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="hb-title">{t("dashboard.requestBook.selectLabel")}</Label>
              <select
                id="hb-title"
                defaultValue=""
                className="mt-1.5 flex h-10 w-full rounded-lg border border-border bg-card px-3 text-sm font-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentblue"
                {...register("title", {
                  onChange: (e) => {
                    setSelectedTitle(e.target.value);
                    setValue("medium", "");
                  },
                })}
              >
                <option value="" disabled>
                  {t("dashboard.requestBook.selectPlaceholder")}
                </option>
                {bookNames.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                    {([b.className, b.author, b.medium, b.institutionName].filter(Boolean).length > 0
                      ? ` (${[b.className, b.author, b.medium, b.institutionName].filter(Boolean).join(" • ")})`
                      : "")}
                  </option>
                ))}
              </select>
            </div>
            {mediumOptions.length > 0 && (
              <div>
                <Label htmlFor="hb-medium">{t("dashboard.requestBook.mediumLabel")}</Label>
                <select
                  id="hb-medium"
                  defaultValue=""
                  className="mt-1.5 flex h-10 w-full rounded-lg border border-border bg-card px-3 text-sm font-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentblue"
                  {...register("medium")}
                >
                  <option value="" disabled>
                    {t("dashboard.requestBook.mediumPlaceholder")}
                  </option>
                  {mediumOptions.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <Label htmlFor="hb-note">{t("dashboard.requestBook.noteLabel")}</Label>
              <textarea
                id="hb-note"
                rows={2}
                placeholder={t("dashboard.requestBook.notePlaceholder")}
                className="mt-1.5 flex w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-body placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentblue"
                {...register("note")}
              />
            </div>
            {error && <p className="text-sm text-brandred">{t("dashboard.requestBook.error")}</p>}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? t("dashboard.requestBook.submitting") : t("dashboard.requestBook.submit")}
            </Button>
          </form>
        ))}

        <div className={showForm ? "mt-5 border-t border-border pt-4" : ""}>
          <p className="mb-2 text-sm font-medium text-text-primary">{t("dashboard.requestBook.accessRequests")}</p>
          {accessRequests.length === 0 ? (
            <p className="text-sm text-text-secondary">{t("dashboard.requestBook.empty")}</p>
          ) : (
            <div className="max-h-60 space-y-3 overflow-y-auto">
              {accessRequests.map((r) => (
                <div key={r.id} className="flex items-start justify-between gap-2 border-b border-border pb-2 last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{r.book.title}</p>
                    <p className="text-xs text-text-secondary">{formatRelativeTime(r.createdAt)}</p>
                  </div>
                  <Badge variant={accessRequestStatusVariant[r.status]} className="shrink-0">
                    {t(`dashboard.requestBook.status.${r.status.toLowerCase()}`)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 border-t border-border pt-4">
          <p className="mb-2 text-sm font-medium text-text-primary">{t("dashboard.requestBook.yourRequests")}</p>
          {suggestions.length === 0 ? (
            <p className="text-sm text-text-secondary">{t("dashboard.requestBook.empty")}</p>
          ) : (
            <div className="max-h-60 space-y-3 overflow-y-auto">
              {suggestions.map((s) => (
                <div key={s.id} className="flex items-start justify-between gap-2 border-b border-border pb-2 last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{s.title}</p>
                    <p className="text-xs text-text-secondary">{formatRelativeTime(s.createdAt)}</p>
                  </div>
                  <Badge variant={statusVariant[s.status]} className="shrink-0">
                    {t(`dashboard.requestBook.status.${s.status.toLowerCase()}`)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
