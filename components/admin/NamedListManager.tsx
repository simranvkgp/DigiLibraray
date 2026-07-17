"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { translate, type Lang } from "@/lib/i18n/translate";

interface Row {
  id: string;
  name: string;
  _count: { books: number; users: number };
}

export function NamedListManager({
  apiPath,
  itemLabel,
  dataKey,
  lang = "en",
}: {
  apiPath: string;
  itemLabel: string;
  dataKey: string;
  lang?: Lang;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const t = (key: string) => translate(lang, key);

  const load = useCallback(() => {
    setLoading(true);
    fetch(apiPath)
      .then((r) => r.json())
      .then((d) => setRows(d[dataKey] ?? []))
      .finally(() => setLoading(false));
  }, [apiPath, dataKey]);

  useEffect(() => {
    load();
  }, [load]);

  async function add() {
    if (!newName.trim()) return;
    setError(null);
    const res = await fetch(apiPath, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? t("admin.namedList.addError"));
      return;
    }
    setNewName("");
    load();
  }

  async function remove(id: string) {
    setBusyId(id);
    setError(null);
    const res = await fetch(`${apiPath}/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? t("admin.namedList.deleteError"));
    }
    await load();
    setBusyId(null);
  }

  const placeholder = t("admin.namedList.newItemName").replace("{item}", itemLabel.toLowerCase());

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <Input
          placeholder={placeholder}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <Button onClick={add}>{t("admin.namedList.add")}</Button>
      </div>
      {error && <p className="mb-3 text-sm text-brandred">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-text-secondary">
            <tr>
              <th className="p-3 font-medium">{itemLabel}</th>
              <th className="p-3 font-medium">{t("admin.nav.books")}</th>
              <th className="p-3 font-medium">{t("admin.nav.users")}</th>
              <th className="p-3 font-medium text-right">{t("admin.table.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {!loading && rows.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0">
                <td className="p-3 font-medium">{r.name}</td>
                <td className="p-3 data-text">{r._count.books}</td>
                <td className="p-3 data-text">{r._count.users}</td>
                <td className="p-3 text-right">
                  <Button size="sm" variant="ghost" disabled={busyId === r.id} onClick={() => remove(r.id)}>{t("action.delete")}</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <p className="p-6 text-center text-sm text-text-secondary">{t("action.loading")}</p>}
        {!loading && rows.length === 0 && <p className="p-6 text-center text-sm text-text-secondary">{t("admin.namedList.empty")}</p>}
      </div>
    </div>
  );
}
