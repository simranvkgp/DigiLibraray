"use client";

import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AddBookForm } from "@/components/admin/AddBookForm";
import { translate, type Lang } from "@/lib/i18n/translate";

interface AdminBookRow {
  id: string;
  title: string;
  subject: string;
  fileType: string;
  status: string;
  viewCount: number;
  coverImageUrl: string | null;
  category: { name: string };
  board: { name: string };
}

const statusVariant: Record<string, "default" | "success" | "warning" | "destructive"> = {
  PUBLISHED: "success",
  DRAFT: "default",
  ARCHIVED: "warning",
  HIDDEN: "destructive",
};

const statusKey: Record<string, string> = {
  PUBLISHED: "admin.books.status.published",
  DRAFT: "admin.books.status.draft",
  ARCHIVED: "admin.books.status.archived",
  HIDDEN: "admin.books.status.hidden",
};

export function BookManagementTable({ lang = "en" }: { lang?: Lang }) {
  const [books, setBooks] = useState<AdminBookRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const t = (key: string) => translate(lang, key);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/books")
      .then((r) => r.json())
      .then((d) => setBooks(d.books ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(id: string, status: string) {
    setBusyId(id);
    await fetch(`/api/admin/books/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await load();
    setBusyId(null);
  }

  async function duplicate(id: string) {
    setBusyId(id);
    await fetch(`/api/admin/books/${id}/duplicate`, { method: "POST" });
    await load();
    setBusyId(null);
  }

  async function remove(id: string) {
    if (!confirm(t("admin.books.confirmDelete"))) return;
    setBusyId(id);
    await fetch(`/api/admin/books/${id}`, { method: "DELETE" });
    await load();
    setBusyId(null);
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setShowForm((s) => !s)}>{showForm ? t("action.close") : t("admin.books.addNew")}</Button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-xl border border-border bg-card p-5">
          <AddBookForm onCreated={() => { setShowForm(false); load(); }} lang={lang} />
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-text-secondary">
            <tr>
              <th className="p-3 font-medium">{t("admin.field.title")}</th>
              <th className="p-3 font-medium">{t("admin.table.categoryBoard")}</th>
              <th className="p-3 font-medium">{t("admin.field.type")}</th>
              <th className="p-3 font-medium">{t("admin.table.status")}</th>
              <th className="p-3 font-medium">{t("admin.table.views")}</th>
              <th className="p-3 font-medium text-right">{t("admin.table.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {!loading && books.map((b) => (
              <tr key={b.id} className="border-b border-border last:border-0">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-8 flex-shrink-0 overflow-hidden rounded bg-background">
                      {b.coverImageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={b.coverImageUrl} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{b.title}</p>
                      <p className="text-xs text-text-secondary">{b.subject}</p>
                    </div>
                  </div>
                </td>
                <td className="p-3">{b.category.name} / {b.board.name}</td>
                <td className="p-3"><Badge variant="outline">{b.fileType}</Badge></td>
                <td className="p-3"><Badge variant={statusVariant[b.status]}>{statusKey[b.status] ? t(statusKey[b.status]) : b.status}</Badge></td>
                <td className="p-3 data-text">{b.viewCount}</td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-1.5">
                    {b.status !== "PUBLISHED" && (
                      <Button size="sm" variant="success" disabled={busyId === b.id} onClick={() => setStatus(b.id, "PUBLISHED")}>{t("admin.books.publish")}</Button>
                    )}
                    {b.status === "PUBLISHED" && (
                      <Button size="sm" variant="outline" disabled={busyId === b.id} onClick={() => setStatus(b.id, "ARCHIVED")}>{t("admin.books.archive")}</Button>
                    )}
                    <Button size="sm" variant="outline" disabled={busyId === b.id} onClick={() => setStatus(b.id, "HIDDEN")}>{t("admin.books.hide")}</Button>
                    <Button size="sm" variant="ghost" disabled={busyId === b.id} onClick={() => duplicate(b.id)}>{t("admin.books.duplicate")}</Button>
                    <Button size="sm" variant="ghost" disabled={busyId === b.id} onClick={() => remove(b.id)}>{t("action.delete")}</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <p className="p-6 text-center text-sm text-text-secondary">{t("action.loading")}</p>}
        {!loading && books.length === 0 && <p className="p-6 text-center text-sm text-text-secondary">{t("admin.books.empty")}</p>}
      </div>
    </div>
  );
}
