"use client";

import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatRelativeTime } from "@/lib/utils";
import { translate, type Lang } from "@/lib/i18n/translate";

interface AdminBookRequestRow {
  id: string;
  status: string;
  note: string | null;
  adminNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
  user: { id: string; name: string; email: string; institution: string; category: string; board: string };
  book: { id: string; title: string; subject: string | null; className: string | null; coverImageUrl: string | null; category: string; board: string };
}

const statusVariant: Record<string, "warning" | "success" | "destructive"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
};

const statusKey: Record<string, string> = {
  PENDING: "admin.status.pending",
  APPROVED: "admin.status.approved",
  REJECTED: "admin.status.rejected",
};

export function BookRequestsTable({ lang = "en" }: { lang?: Lang }) {
  const [requests, setRequests] = useState<AdminBookRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [rejectOpenId, setRejectOpenId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const t = useCallback((key: string) => translate(lang, key), [lang]);

  const load = useCallback(() => {
    setLoading(true);
    setErrorMessage(null);
    const qs = filter ? `?status=${filter}` : "";
    fetch(`/api/admin/book-requests${qs}`, { credentials: "same-origin" })
      .then(async (r) => {
        if (!r.ok) {
          const payload = await r.json().catch(() => null);
          throw new Error(payload?.error || translate(lang, "admin.requests.loadError") || "Failed to load requests");
        }
        return r.json();
      })
      .then((data) => setRequests(data.requests ?? []))
      .catch((err) => setErrorMessage(err.message || translate(lang, "admin.requests.loadError") || "Failed to load requests"))
      .finally(() => setLoading(false));
  }, [filter, lang]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      load();
    }, 15000);
    return () => window.clearInterval(interval);
  }, [load]);

  async function approve(id: string) {
    setBusyId(id);
    await fetch(`/api/admin/book-requests/${id}/approve`, { method: "POST", credentials: "same-origin" });
    await load();
    setBusyId(null);
  }

  async function deleteRequest(id: string) {
    setBusyId(id);
    await fetch(`/api/admin/book-requests/${id}`, { method: "DELETE", credentials: "same-origin" });
    await load();
    setBusyId(null);
  }

  async function reject(id: string) {
    setBusyId(id);
    await fetch(`/api/admin/book-requests/${id}/reject`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminNote: rejectNote }),
    });
    setRejectNote("");
    setRejectOpenId(null);
    await load();
    setBusyId(null);
  }

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {["", "PENDING", "APPROVED", "REJECTED"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              filter === s ? "bg-navy text-white" : "bg-card text-text-secondary border border-border"
            }`}
          >
            {s ? t(statusKey[s]) : t("admin.common.all")}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-text-secondary">
            <tr>
              <th className="p-3 font-medium">{t("admin.requests.col.user")}</th>
              <th className="p-3 font-medium">{t("admin.requests.col.book")}</th>
              <th className="hidden p-3 font-medium md:table-cell">{t("admin.requests.col.note")}</th>
              <th className="hidden p-3 font-medium md:table-cell">{t("admin.requests.col.requested")}</th>
              <th className="p-3 font-medium">{t("admin.table.status")}</th>
              <th className="p-3 font-medium text-right">{t("admin.table.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {!loading &&
              requests.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 align-top">
                  <td className="p-3">
                    <p className="font-medium">{r.user.name}</p>
                    <p className="text-xs text-text-secondary">{r.user.email}</p>
                    <p className="text-xs text-text-secondary">
                      {r.user.institution} · {r.user.category} / {r.user.board}
                    </p>
                  </td>
                  <td className="p-3">
                    <p className="font-medium">{r.book.title}</p>
                    <p className="text-xs text-text-secondary">
                      {[r.book.subject, r.book.className, r.book.category, r.book.board].filter(Boolean).join(" · ")}
                    </p>
                  </td>
                  <td className="hidden p-3 max-w-xs md:table-cell">
                    <p className="text-xs text-text-secondary">{r.note || "—"}</p>
                    {r.status === "REJECTED" && r.adminNote && (
                      <p className="mt-1 text-xs text-brandred">{t("admin.requests.rejectReason")}: {r.adminNote}</p>
                    )}
                  </td>
                  <td className="hidden p-3 text-xs text-text-secondary md:table-cell">{formatRelativeTime(r.createdAt)}</td>
                  <td className="p-3">
                    <Badge variant={statusVariant[r.status] ?? "warning"}>{t(statusKey[r.status] ?? "admin.status.pending")}</Badge>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1.5 flex-wrap">
                      {r.status === "PENDING" && (
                        <>
                          <Button size="sm" variant="success" disabled={busyId === r.id} onClick={() => approve(r.id)}>
                            {t("admin.requests.approve")}
                          </Button>
                          <Dialog
                            open={rejectOpenId === r.id}
                            onOpenChange={(open) => {
                              setRejectOpenId(open ? r.id : null);
                              if (!open) setRejectNote("");
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button size="sm" variant="destructive" disabled={busyId === r.id}>
                                {t("admin.requests.reject")}
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>{t("admin.requests.reject")}</DialogTitle>
                                <DialogDescription>{r.book.title} — {r.user.name}</DialogDescription>
                              </DialogHeader>
                              <textarea
                                rows={3}
                                placeholder={t("admin.requests.rejectReason")}
                                value={rejectNote}
                                onChange={(e) => setRejectNote(e.target.value)}
                                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-body placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentblue"
                              />
                              <Button
                                className="mt-4 w-full"
                                variant="destructive"
                                disabled={busyId === r.id}
                                onClick={() => reject(r.id)}
                              >
                                {t("admin.requests.rejectSubmit")}
                              </Button>
                            </DialogContent>
                          </Dialog>
                        </>
                      )}
                      {r.status === "APPROVED" && (
                        <Button size="sm" variant="success" disabled={busyId === r.id} onClick={() => approve(r.id)}>
                          {t("admin.requests.reaccess")}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={busyId === r.id}
                        onClick={() => {
                          if (window.confirm(t("admin.requests.confirmDelete"))) {
                            deleteRequest(r.id);
                          }
                        }}
                      >
                        {t("admin.requests.delete")}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        {loading && <p className="p-6 text-center text-sm text-text-secondary">{t("action.loading")}</p>}
        {!loading && errorMessage && (
          <p className="p-6 text-center text-sm text-brandred">{errorMessage}</p>
        )}
        {!loading && !errorMessage && requests.length === 0 && (
          <p className="p-6 text-center text-sm text-text-secondary">{t("admin.requests.empty")}</p>
        )}
      </div>
    </div>
  );
}
