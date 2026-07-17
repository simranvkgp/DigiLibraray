"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { translate, type Lang } from "@/lib/i18n/translate";

type CategoryOption = { id: string; name: string; slug: string };

export function CategoryPicker({
  categories,
  currentCategoryId,
  isSealed,
  lang = "en",
}: {
  categories: CategoryOption[];
  currentCategoryId: string | null;
  isSealed: boolean;
  lang?: Lang;
}) {
  const { update } = useSession();
  const t = (key: string) => translate(lang, key);
  const [selectedId, setSelectedId] = useState<string | null>(currentCategoryId);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Once locked into Secondary/Senior Secondary, University becomes unselectable.
  // Once locked into University (isSealed), everything is unselectable.
  function isDisabled(cat: CategoryOption) {
    if (isSealed) return true;
    if (currentCategoryId && cat.slug === "university") return true;
    return false;
  }

  const selected = categories.find((c) => c.id === selectedId);

  async function confirmChoice() {
    if (!selectedId) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/category", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId: selectedId }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? t("category.genericError"));
      setSubmitting(false);
      setConfirming(false);
      return;
    }
    // Refresh the session cookie so middleware sees the newly-locked category
    // instead of bouncing us back here on the stale pre-choice token.
    // `update()` with no argument is a no-op GET — a payload is required to
    // make next-auth POST and actually re-derive the JWT.
    await update({});
    // A hard navigation (not router.push+refresh) guarantees this request
    // carries the just-refreshed cookie and re-runs middleware from scratch —
    // router.push immediately followed by router.refresh() is a race that can
    // re-render the route we're leaving instead of the one we're going to.
    window.location.href = "/dashboard";
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {categories.map((cat) => {
          const disabled = isDisabled(cat);
          return (
            <Card
              key={cat.id}
              onClick={() => !disabled && setSelectedId(cat.id)}
              className={cn(
                "p-6 text-center transition-all",
                disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer",
                selectedId === cat.id ? "border-navy ring-2 ring-navy" : ""
              )}
            >
              <p className="font-display text-lg font-medium text-navy">{cat.name}</p>
              {currentCategoryId === cat.id && (
                <p className="mt-1 text-xs text-text-secondary">{t("category.current")}</p>
              )}
            </Card>
          );
        })}
      </div>

      {error && <p className="mt-4 text-center text-sm text-brandred">{error}</p>}

      {!isSealed && (
        <div className="mt-8 flex justify-center">
          <Button
            size="lg"
            disabled={!selectedId || selectedId === currentCategoryId}
            onClick={() => setConfirming(true)}
          >
            {currentCategoryId ? t("category.saveChange") : t("category.continue")}
          </Button>
        </div>
      )}

      {confirming && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-card p-6 shadow-card-hover">
            <h2 className="font-display text-lg font-semibold text-navy">{t("category.confirmTitle")}</h2>
            <p className="mt-2 text-sm text-text-secondary">
              {selected.slug === "university"
                ? t("category.confirmUniversityNote")
                : t("category.confirmSwitchNote").replace("{name}", selected.name)}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirming(false)} disabled={submitting}>
                {t("action.goBack")}
              </Button>
              <Button onClick={confirmChoice} disabled={submitting}>
                {submitting ? t("action.saving") : t("action.confirm")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
