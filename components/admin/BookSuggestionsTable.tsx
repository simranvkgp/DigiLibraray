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

interface AdminBookSuggestionRow {
  id: string;
  title: string;
  author: string | null;
  subject: string | null;
  className: string | null;
  status: string;
  note: string | null;
  adminNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
  user: { id: string; name: string; email: string; institution: string; category: string; board: string };
}

interface AdminBookOption {
  id: string;
  title: string;
  subject: string;
  category: { name: string };
  board: { name: string };
}

const statusVariant: Record<string, "warning" | "success" | "destructive"> = {
  PENDING: "warning",
  ADDED: "success",
  REJECTED: "destructive",
};

const statusKey: Record<string, string> = {
  PENDING: "admin.status.pending",
  ADDED: "admin.status.added",
  REJECTED: "admin.status.rejected",
};

export function BookSuggestionsTable({ lang = "en" }: { lang?: Lang }) {
  const [suggestions, setSuggestions] = useState<AdminBookSuggestionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [rejectOpenId, setRejectOpenId] = useState<string | null>(null);
  const [books, setBooks] = useState<AdminBookOption[]>([]);
  const [accessOpenId, setAccessOpenId] = useState<string | null>(null);
  const [accessQuery, setAccessQuery] = useState("");
  const [selectedBookId, setSelectedBookId] = useState("");
  const [accessError, setAccessError] = useState<string | null>(null);
  const t = (key: string) => translate(lang, key);

  const load = useCallback(() => {
    setLoading(true);
    const qs = filter ? `?status=${filter}` : "";
    fetch(`/api/admin/book-suggestions${qs}`)
      .then((r) => r.json())
      .then((data) => setSuggestions(data.suggestions ?? []))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => {
    load();
    fetch("/api/admin/books").then((r) => r.json()).then((d) => setBooks(d.books ?? []));
  }, [load]);

  function openAccess(id: string) {
    setAccessOpenId(id);
    setAccessQuery("");
    setSelectedBookId("");
    setAccessError(null);
  }

  async function giveAccess(id: string) {
    if (!selectedBookId) {
      setAccessError(t("admin.suggestions.addBookFirst"));
      return;
    }
    setBusyId(id);
    setAccessError(null);
    const res = await fetch(`/api/admin/book-suggestions/${id}/fulfill`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId: selectedBookId }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setAccessError(d.error ?? t("admin.suggestions.addBookFirst"));
      setBusyId(null);
      return;
    }
    setBusyId(null);
    setAccessOpenId(null);
    await load();
  }

  async function reject(id: string) {
    setBusyId(id);
    await fetch(`/api/admin/book-suggestions/${id}/reject`, {
      method: "POST",
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
        {["", "PENDING", "ADDED", "REJECTED"].map((s) => (
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
              <th className="p-3 font-medium">{t("admin.suggestions.col.book")}</th>
              <th className="p-3 font-medium">{t("admin.requests.col.note")}</th>
              <th className="p-3 font-medium">{t("admin.requests.col.requested")}</th>
              <th className="p-3 font-medium">{t("admin.table.status")}</th>
              <th className="p-3 font-medium text-right">{t("admin.table.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {!loading &&
              suggestions.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0 align-top">
                  <td className="p-3">
                    <p className="font-medium">{s.user.name}</p>
                    <p className="text-xs text-text-secondary">{s.user.email}</p>
                    <p className="text-xs text-text-secondary">
                      {s.user.institution} · {s.user.category} / {s.user.board}
                    </p>
                  </td>
                  <td className="p-3">
                    <p className="font-medium">{s.title}</p>
                    <p className="text-xs text-text-secondary">
                      {[s.author, s.subject, s.className].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </td>
                  <td className="p-3 max-w-xs">
                    <p className="text-xs text-text-secondary">{s.note || "—"}</p>
                    {s.status === "REJECTED" && s.adminNote && (
                      <p className="mt-1 text-xs text-brandred">{t("admin.requests.rejectReason")}: {s.adminNote}</p>
                    )}
                  </td>
                  <td className="p-3 text-xs text-text-secondary">{formatRelativeTime(s.createdAt)}</td>
                  <td className="p-3">
                    <Badge variant={statusVariant[s.status] ?? "warning"}>{t(statusKey[s.status] ?? "admin.status.pending")}</Badge>
                  </td>
                  <td className="p-3 text-right">
                    {s.status === "PENDING" && (
                      <div className="flex justify-end gap-1.5">
                        <Dialog
                          open={accessOpenId === s.id}
                          onOpenChange={(open) => (open ? openAccess(s.id) : setAccessOpenId(null))}
                        >
                          <DialogTrigger asChild>
                            <Button size="sm" variant="success" disabled={busyId === s.id}>
                              {t("admin.suggestions.access")}
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>{t("admin.suggestions.access")}</DialogTitle>
                              <DialogDescription>{s.title} — {s.user.name}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-1 rounded-lg border border-border bg-background p-3 text-sm">
                              <p><span className="text-text-secondary">{t("admin.field.author")}:</span> {s.author || "—"}</p>
                              <p><span className="text-text-secondary">{t("admin.field.subject")}:</span> {s.subject || "—"}</p>
                              <p><span className="text-text-secondary">{t("admin.field.class")}:</span> {s.className || "—"}</p>
                              {s.note && <p><span className="text-text-secondary">{t("admin.requests.col.note")}:</span> {s.note}</p>}
                            </div>
                            <div className="mt-3">
                              <input
                                type="text"
                                autoComplete="off"
                                placeholder={t("admin.suggestions.searchBookPlaceholder")}
                                value={accessQuery}
                                onChange={(e) => setAccessQuery(e.target.value)}
                                className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm font-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentblue"
                              />
                              <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-border">
                                {books
                                  .filter((b) => b.title.toLowerCase().includes(accessQuery.trim().toLowerCase()))
                                  .map((b) => (
                                    <button
                                      key={b.id}
                                      type="button"
                                      onClick={() => {
                                        setSelectedBookId(b.id);
                                        setAccessError(null);
                                      }}
                                      className={`block w-full border-b border-border p-2.5 text-left last:border-0 hover:bg-accentblue/10 ${
                                        selectedBookId === b.id ? "bg-accentblue/10" : ""
                                      }`}
                                    >
                                      <p className="truncate text-sm font-medium">{b.title}</p>
                                      <p className="truncate text-xs text-text-secondary">
                                        {b.subject} · {b.category.name} / {b.board.name}
                                      </p>
                                    </button>
                                  ))}
                                {books.filter((b) => b.title.toLowerCase().includes(accessQuery.trim().toLowerCase())).length === 0 && (
                                  <p className="p-3 text-sm text-text-secondary">{t("admin.suggestions.noBooksFound")}</p>
                                )}
                              </div>
                            </div>
                            {accessError && <p className="mt-2 text-sm text-brandred">{accessError}</p>}
                            <Button
                              className="mt-4 w-full"
                              variant="success"
                              disabled={busyId === s.id}
                              onClick={() => giveAccess(s.id)}
                            >
                              {t("admin.suggestions.giveAccess")}
                            </Button>
                          </DialogContent>
                        </Dialog>
                        <Dialog
                          open={rejectOpenId === s.id}
                          onOpenChange={(open) => {
                            setRejectOpenId(open ? s.id : null);
                            if (!open) setRejectNote("");
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button size="sm" variant="destructive" disabled={busyId === s.id}>
                              {t("admin.suggestions.reject")}
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>{t("admin.suggestions.reject")}</DialogTitle>
                              <DialogDescription>{s.title} — {s.user.name}</DialogDescription>
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
                              disabled={busyId === s.id}
                              onClick={() => reject(s.id)}
                            >
                              {t("admin.requests.rejectSubmit")}
                            </Button>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        {loading && <p className="p-6 text-center text-sm text-text-secondary">{t("action.loading")}</p>}
        {!loading && suggestions.length === 0 && (
          <p className="p-6 text-center text-sm text-text-secondary">{t("admin.suggestions.empty")}</p>
        )}
      </div>
    </div>
  );
}
