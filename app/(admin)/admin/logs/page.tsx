"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { translate, type Lang } from "@/lib/i18n/translate";

interface LogRow {
  id: string;
  action: string;
  createdAt: string;
  user: { name: string; email: string } | null;
}

const actionVariant: Record<string, "default" | "success" | "warning" | "destructive" | "accent"> = {
  LOGIN: "accent",
  REGISTER: "default",
  BOOK_VIEW: "success",
  BOOK_DOWNLOAD: "success",
};

const actionKey: Record<string, string> = {
  LOGIN: "admin.logs.action.login",
  REGISTER: "admin.logs.action.register",
  BOOK_VIEW: "admin.logs.action.bookView",
  BOOK_DOWNLOAD: "admin.logs.action.bookDownload",
};

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<Lang>("en");
  const t = (key: string) => translate(lang, key);

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((d) => {
      if (d.settings?.language === "hi") setLang("hi");
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    const qs = filter ? `?action=${filter}` : "";
    fetch(`/api/admin/logs${qs}`).then((r) => r.json()).then((d) => setLogs(d.logs ?? [])).finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="p-8">
      <h1 className="font-display text-2xl font-medium text-navy">{t("admin.logs.title")}</h1>
      <p className="mt-1 text-sm text-text-secondary">{t("admin.logs.subtitle")}</p>

      <div className="my-4 flex gap-2">
        {["", "LOGIN", "REGISTER", "BOOK_VIEW"].map((a) => (
          <button
            key={a}
            onClick={() => setFilter(a)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${filter === a ? "bg-navy text-white" : "border border-border text-text-secondary"}`}
          >
            {a ? t(actionKey[a]) : t("admin.common.all")}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-text-secondary">
            <tr>
              <th className="p-3 font-medium">{t("admin.field.user")}</th>
              <th className="p-3 font-medium">{t("admin.logs.col.action")}</th>
              <th className="p-3 font-medium">{t("admin.logs.col.when")}</th>
            </tr>
          </thead>
          <tbody>
            {!loading && logs.map((l) => (
              <tr key={l.id} className="border-b border-border last:border-0">
                <td className="p-3">{l.user ? `${l.user.name} (${l.user.email})` : "—"}</td>
                <td className="p-3"><Badge variant={actionVariant[l.action] ?? "default"}>{actionKey[l.action] ? t(actionKey[l.action]) : l.action}</Badge></td>
                <td className="p-3 data-text text-xs">{new Date(l.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <p className="p-6 text-center text-sm text-text-secondary">{t("action.loading")}</p>}
        {!loading && logs.length === 0 && <p className="p-6 text-center text-sm text-text-secondary">{t("admin.logs.empty")}</p>}
      </div>
    </div>
  );
}
