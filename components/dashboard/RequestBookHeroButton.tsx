"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  const [query, setQuery] = useState("");
  const [selectedName, setSelectedName] = useState("");
  const [isListOpen, setIsListOpen] = useState(false);
  const comboRef = useRef<HTMLDivElement>(null);
  const {
    suggestions,
    accessRequests,
    bookNames,
    error,
    register,
    setValue,
    handleSubmit,
    isSubmitting,
    onSubmit,
    hasPendingSuggestion,
  } = useBookRequests();

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? bookNames.filter((b) => b.name.toLowerCase().includes(q)) : bookNames;
  }, [bookNames, query]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (comboRef.current && !comboRef.current.contains(e.target as Node)) setIsListOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function selectBook(name: string) {
    setSelectedName(name);
    setQuery(name);
    setValue("title", name, { shouldValidate: true });
    setIsListOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
                setQuery("");
                setSelectedName("");
              })
            )}
            className="space-y-4"
          >
            <div ref={comboRef} className="relative">
              <Label htmlFor="hb-title">{t("dashboard.requestBook.selectLabel")}</Label>
              <input type="hidden" {...register("title")} />
              <input
                id="hb-title"
                type="text"
                autoComplete="off"
                placeholder={t("dashboard.requestBook.searchPlaceholder")}
                value={query}
                onFocus={() => setIsListOpen(true)}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setIsListOpen(true);
                  if (e.target.value !== selectedName) {
                    setSelectedName("");
                    setValue("title", "", { shouldValidate: false });
                  }
                }}
                className="mt-1.5 flex h-10 w-full rounded-lg border border-border bg-card px-3 text-sm font-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentblue"
              />
              {isListOpen && (
                <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
                  {matches.length === 0 ? (
                    <p className="p-3 text-sm text-text-secondary">{t("dashboard.requestBook.noMatches")}</p>
                  ) : (
                    matches.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => selectBook(b.name)}
                        className="block w-full border-b border-border p-2.5 text-left last:border-0 hover:bg-accentblue/10"
                      >
                        <p className="truncate text-sm font-medium">{b.name}</p>
                        <p className="truncate text-xs text-text-secondary">
                          {[b.className, b.author].filter(Boolean).join(" • ") || "—"}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
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
