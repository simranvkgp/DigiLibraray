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
  medium: string | null;
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

function bestMatchBook(requestedTitle: string, books: AdminBookOption[]): AdminBookOption | null {
  const target = requestedTitle.toLowerCase().trim();
  const exact = books.find((b) => b.title.toLowerCase().trim() === target);
  if (exact) return exact;

  const words = target.split(/[^a-z0-9]+/).filter((w) => w.length > 2);
  if (words.length === 0) return null;

  let best: AdminBookOption | null = null;
  let bestScore = 0;
  for (const b of books) {
    const title = b.title.toLowerCase();
    const score = words.filter((w) => title.includes(w)).length;
    if (score > bestScore) {
      bestScore = score;
      best = b;
    }
  }
  return best;
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
  const [bookNamesAdmin, setBookNamesAdmin] = useState<any[]>([]);
  const [accessOpenId, setAccessOpenId] = useState<string | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [mailSentId, setMailSentId] = useState<string | null>(null);
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
    fetch("/api/admin/book-names").then((r) => r.json()).then((d) => setBookNamesAdmin(d.bookNames ?? []));
  }, [load]);

  function openAccess(id: string) {
    setAccessOpenId(id);
    setAccessError(null);
  }

  async function giveAccess(suggestionId: string, bookId: string) {
    setBusyId(suggestionId);
    setAccessError(null);
    const res = await fetch(`/api/admin/book-suggestions/${suggestionId}/fulfill`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setAccessError(d.error ?? t("admin.suggestions.addBookFirst"));
      setBusyId(null);
      return;
    }
    setBusyId(null);
    setAccessOpenId(null);
    setMailSentId(suggestionId);
    await load();
    setTimeout(() => setMailSentId((current) => (current === suggestionId ? null : current)), 4000);
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

  async function deleteSuggestion(id: string) {
    setBusyId(id);
    await fetch(`/api/admin/book-suggestions/${id}`, { method: "DELETE" });
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
              <th className="hidden p-3 font-medium md:table-cell">{t("admin.requests.col.medium")}</th>
              <th className="hidden p-3 font-medium md:table-cell">{t("admin.requests.col.institutionBoard")}</th>
              <th className="hidden p-3 font-medium md:table-cell">{t("admin.requests.col.note")}</th>
              <th className="hidden p-3 font-medium md:table-cell">{t("admin.requests.col.requested")}</th>
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
                  <td className="hidden p-3 text-xs text-text-secondary md:table-cell">
                    {s.medium ?? "—"}
                  </td>
                  <td className="hidden p-3 md:table-cell">
                    <p className="text-xs font-medium">{s.user.institution || "—"}</p>
                    <p className="text-xs text-text-secondary">
                      {[s.user.category, s.user.board].filter(Boolean).join(" / ") || "—"}
                    </p>
                    {(() => {
                      const catalogMatch = bookNamesAdmin.find(
                        (bn) => bn.name?.toLowerCase().trim() === s.title.toLowerCase().trim()
                      )?.institutionName;
                      return catalogMatch ? (
                        <p className="mt-0.5 text-[11px] text-text-secondary/70">
                          {t("admin.suggestions.bookNameMatches")}: {catalogMatch}
                        </p>
                      ) : null;
                    })()}
                  </td>
                  <td className="hidden p-3 max-w-xs md:table-cell">
                    <p className="text-xs text-text-secondary">{s.note || "—"}</p>
                    {s.status === "REJECTED" && s.adminNote && (
                      <p className="mt-1 text-xs text-brandred">{t("admin.requests.rejectReason")}: {s.adminNote}</p>
                    )}
                  </td>
                  <td className="hidden p-3 text-xs text-text-secondary md:table-cell">{formatRelativeTime(s.createdAt)}</td>
                  <td className="p-3">
                    <Badge variant={statusVariant[s.status] ?? "warning"}>{t(statusKey[s.status] ?? "admin.status.pending")}</Badge>
                  </td>
                  <td className="p-3 text-right">
                    {mailSentId === s.id && (
                      <p className="text-xs font-medium text-success">{t("admin.suggestions.mailSent")}</p>
                    )}
                    <div className="flex justify-end gap-1.5 flex-wrap">
                      {(s.status === "PENDING" || s.status === "ADDED") && (
                        <Dialog
                          open={accessOpenId === s.id}
                          onOpenChange={(open) => (open ? openAccess(s.id) : setAccessOpenId(null))}
                        >
                          <DialogTrigger asChild>
                            <Button size="sm" variant="success" disabled={busyId === s.id}>
                              {s.status === "ADDED" ? t("admin.requests.reaccess") : t("admin.suggestions.access")}
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>{s.title}</DialogTitle>
                              <DialogDescription>{t("admin.suggestions.access")} — {s.user.name}</DialogDescription>
                            </DialogHeader>
                            <div className="mt-1 max-h-72 space-y-2 overflow-y-auto">
                              {(() => {
                                const match = bestMatchBook(s.title, books);
                                if (!match) {
                                  return <p className="p-3 text-sm text-text-secondary">{t("admin.suggestions.noBooksFound")}</p>;
                                }
                                return (
                                  <div className="rounded-lg border border-border p-3">
                                    <p className="truncate text-sm font-medium">{match.title}</p>
                                    <p className="truncate text-xs text-text-secondary">
                                      {match.subject} · {match.category.name} / {match.board.name}
                                    </p>
                                    <Button
                                      className="mt-2 w-full"
                                      variant="success"
                                      disabled={busyId === s.id}
                                      onClick={() => giveAccess(s.id, match.id)}
                                    >
                                      {t("admin.suggestions.access")}
                                    </Button>
                                  </div>
                                );
                              })()}
                            </div>
                            {accessError && <p className="mt-2 text-sm text-brandred">{accessError}</p>}
                          </DialogContent>
                        </Dialog>
                      )}
                      {s.status === "PENDING" && (
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
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={busyId === s.id}
                        onClick={() => {
                          if (window.confirm(t("admin.requests.confirmDelete"))) {
                            deleteSuggestion(s.id);
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
        {!loading && suggestions.length === 0 && (
          <p className="p-6 text-center text-sm text-text-secondary">{t("admin.suggestions.empty")}</p>
        )}
      </div>
    </div>
  );
}
