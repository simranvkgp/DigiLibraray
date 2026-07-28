"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { translate, type Lang } from "@/lib/i18n/translate";

const POLL_INTERVAL_MS = 5000;

export default function PendingApprovalPage() {
  const { data: session, update } = useSession();
  const polling = useRef(false);
  const [lang, setLang] = useState<Lang>("en");
  const t = (key: string) => translate(lang, key);

  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d?.settings?.language === "hi") setLang("hi");
      })
      .catch(() => {});
  }, [session?.user]);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (polling.current) return;
      polling.current = true;
      // Forces a fresh DB read of approvalStatus into the session (see
      // lib/auth.ts's jwt callback) — a plain getSession() would just
      // re-read the still-stale cookie.
      const fresh = await update({});
      polling.current = false;
      const status = (fresh?.user as any)?.approvalStatus;
      if (status === "APPROVED") {
        window.location.href = "/dashboard";
      } else if (status === "REJECTED" || status === "SUSPENDED") {
        window.location.href = "/account-restricted";
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [update]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-card">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
          <span className="text-2xl">⏳</span>
        </div>
        <h1 className="font-display text-xl font-semibold text-navy">{t("pending.title")}</h1>
        <p className="mt-2 text-sm text-text-secondary">{t("pending.body")}</p>
      </div>
    </div>
  );
}
