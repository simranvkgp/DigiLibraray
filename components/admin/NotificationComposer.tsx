"use client";

import { useEffect, useState, useCallback } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { translate, type Lang } from "@/lib/i18n/translate";

interface Option { id: string; name: string }
interface NotificationRow {
  id: string;
  title: string;
  body: string;
  type: string;
  createdAt: string;
  _count: { recipients: number };
}

const typeKey: Record<string, string> = {
  ANNOUNCEMENT: "admin.notifications.type.announcement",
  NEW_BOOK: "admin.notifications.type.newBook",
  MAINTENANCE: "admin.notifications.type.maintenance",
};

export function NotificationComposer({ lang = "en" }: { lang?: Lang }) {
  const [categories, setCategories] = useState<Option[]>([]);
  const [boards, setBoards] = useState<Option[]>([]);
  const [history, setHistory] = useState<NotificationRow[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState("ANNOUNCEMENT");
  const [categoryId, setCategoryId] = useState("");
  const [boardId, setBoardId] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const t = (key: string) => translate(lang, key);

  const loadHistory = useCallback(() => {
    fetch("/api/admin/notifications").then((r) => r.json()).then((d) => setHistory(d.notifications ?? []));
  }, []);

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then((d) => setCategories(d.categories ?? []));
    fetch("/api/boards").then((r) => r.json()).then((d) => setBoards(d.boards ?? []));
    loadHistory();
  }, [loadHistory]);

  async function send() {
    if (!title.trim() || !body.trim()) return;
    setSending(true);
    setResult(null);
    const res = await fetch("/api/admin/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, type, categoryId, boardId }),
    });
    if (res.ok) {
      const data = await res.json();
      setResult(t("admin.notifications.sentTo").replace("{count}", String(data.recipientCount)));
      setTitle("");
      setBody("");
      loadHistory();
    } else {
      setResult(t("admin.notifications.sendError"));
    }
    setSending(false);
  }

  async function remove(id: string) {
    if (!confirm(t("admin.notifications.confirmDelete"))) return;
    setBusyId(id);
    await fetch(`/api/admin/notifications/${id}`, { method: "DELETE" });
    loadHistory();
    setBusyId(null);
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-display text-lg font-medium text-navy">{t("admin.notifications.newBroadcast")}</h2>
        <div className="mt-4 space-y-4">
          <div>
            <Label htmlFor="type">{t("admin.field.type")}</Label>
            <select id="type" value={type} onChange={(e) => setType(e.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm">
              <option value="ANNOUNCEMENT">{t("admin.notifications.type.announcement")}</option>
              <option value="NEW_BOOK">{t("admin.notifications.type.newBook")}</option>
              <option value="MAINTENANCE">{t("admin.notifications.type.maintenance")}</option>
            </select>
          </div>
          <div>
            <Label htmlFor="title">{t("admin.field.title")}</Label>
            <Input id="title" className="mt-1.5" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="body">{t("admin.notifications.form.message")}</Label>
            <textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className="mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="categoryFilter">{t("admin.notifications.form.limitCategory")}</Label>
              <select id="categoryFilter" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm">
                <option value="">{t("admin.notifications.form.allCategories")}</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="boardFilter">{t("admin.notifications.form.limitBoard")}</Label>
              <select id="boardFilter" value={boardId} onChange={(e) => setBoardId(e.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm">
                <option value="">{t("admin.notifications.form.allBoards")}</option>
                {boards.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          </div>
          {result && <p className="text-sm text-text-secondary">{result}</p>}
          <Button className="w-full" disabled={sending} onClick={send}>
            {sending ? t("admin.notifications.sending") : t("admin.notifications.send")}
          </Button>
        </div>
      </div>

      <div>
        <h2 className="font-display text-lg font-medium text-navy">{t("admin.notifications.recent")}</h2>
        <div className="mt-4 space-y-3">
          {history.length === 0 && <p className="text-sm text-text-secondary">{t("admin.notifications.empty")}</p>}
          {history.map((n) => (
            <div key={n.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <Badge variant={n.type === "MAINTENANCE" ? "warning" : "accent"}>{typeKey[n.type] ? t(typeKey[n.type]) : n.type.replace("_", " ")}</Badge>
                <div className="flex items-center gap-2">
                  <span className="data-text text-xs text-text-secondary">{t("admin.notifications.recipientsLabel").replace("{count}", String(n._count.recipients))}</span>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-7 w-7"
                    disabled={busyId === n.id}
                    onClick={() => remove(n.id)}
                    aria-label={t("action.delete")}
                    title={t("action.delete")}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
              <p className="mt-2 text-sm font-medium">{n.title}</p>
              <p className="mt-1 text-sm text-text-secondary">{n.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
