"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Upload, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { translate, type Lang } from "@/lib/i18n/translate";

interface CategoryOption {
  id: string;
  name: string;
}

interface InstitutionOption {
  id: string;
  name: string;
}

interface Row {
  id: string;
  name: string;
  className: string | null;
  medium: string | null;
  author: string | null;
  categoryId: string;
  category: CategoryOption;
  institution: InstitutionOption | null;
}

interface UploadResult {
  created: number;
  skippedDuplicates: number;
  sheetsSkipped: string[];
  errors: { row: number; reason: string }[];
}

export function BookNameManager({ lang = "en" }: { lang?: Lang }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newCategoryId, setNewCategoryId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadCategoryId, setUploadCategoryId] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = (key: string) => translate(lang, key);

  const [editingRow, setEditingRow] = useState<Row | null>(null);
  const [editName, setEditName] = useState("");
  const [editClassName, setEditClassName] = useState("");
  const [editMedium, setEditMedium] = useState("");
  const [editAuthor, setEditAuthor] = useState("");
  const [editInstitutionName, setEditInstitutionName] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [removingAll, setRemovingAll] = useState(false);
  const [showRemoveAllConfirm, setShowRemoveAllConfirm] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState("");

  const rowsByCategory = useMemo(() => {
    const map = new Map<string, Row[]>();
    for (const r of rows) {
      const list = map.get(r.categoryId) ?? [];
      list.push(r);
      map.set(r.categoryId, list);
    }
    return map;
  }, [rows]);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/book-names")
      .then((r) => r.json())
      .then((d) => setRows(d.bookNames ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => {
        const cats: CategoryOption[] = d.categories ?? [];
        setCategories(cats);
        setActiveCategoryId((current) => current || cats[0]?.id || "");
      });
  }, [load]);

  async function add() {
    if (!newName.trim() || !newCategoryId) return;
    setError(null);
    const res = await fetch("/api/admin/book-names", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), categoryId: newCategoryId }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? t("admin.namedList.addError"));
      return;
    }
    setNewName("");
    load();
  }

  async function uploadFile(file: File) {
    if (!uploadCategoryId) {
      setUploadError(t("admin.bookNames.selectCategoryFirst"));
      return;
    }
    setUploading(true);
    setUploadError(null);
    setUploadResult(null);
    const form = new FormData();
    form.append("file", file);
    form.append("categoryId", uploadCategoryId);
    const res = await fetch("/api/admin/book-names/bulk-upload", { method: "POST", body: form });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setUploadError(data.error ?? t("admin.bookNames.uploadError"));
    } else {
      setUploadResult(data);
      load();
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function remove(id: string) {
    setBusyId(id);
    setError(null);
    const res = await fetch(`/api/admin/book-names/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? t("admin.namedList.deleteError"));
    }
    await load();
    setBusyId(null);
  }

  function openEdit(row: Row) {
    setEditingRow(row);
    setEditName(row.name);
    setEditClassName(row.className ?? "");
    setEditMedium(row.medium ?? "");
    setEditAuthor(row.author ?? "");
    setEditInstitutionName(row.institution?.name ?? "");
    setEditCategoryId(row.categoryId);
    setEditError(null);
  }

  async function saveEdit() {
    if (!editingRow) return;
    if (!editName.trim() || !editCategoryId) return;
    setEditSaving(true);
    setEditError(null);
    const res = await fetch(`/api/admin/book-names/${editingRow.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName.trim(),
        className: editClassName.trim() || null,
        medium: editMedium.trim() || null,
        author: editAuthor.trim() || null,
        categoryId: editCategoryId,
        institutionName: editInstitutionName.trim() || null,
      }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setEditError(d.error ?? t("admin.bookNames.editError"));
      setEditSaving(false);
      return;
    }
    setEditSaving(false);
    setEditingRow(null);
    load();
  }

  async function confirmRemoveAll() {
    setRemovingAll(true);
    setError(null);
    const res = await fetch("/api/admin/book-names", { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? t("admin.bookNames.removeAllError"));
    }
    await load();
    setRemovingAll(false);
    setShowRemoveAllConfirm(false);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <Input
          placeholder={t("admin.bookNames.placeholder")}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          className="w-full sm:w-auto sm:flex-1"
        />
        <select
          value={newCategoryId}
          onChange={(e) => setNewCategoryId(e.target.value)}
          className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm font-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentblue sm:w-52"
        >
          <option value="">{t("admin.common.selectPlaceholder")}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <Button onClick={add}>{t("admin.namedList.add")}</Button>
      </div>
      {error && <p className="mb-3 text-sm text-brandred">{error}</p>}

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-border bg-card p-4">
        <select
          value={uploadCategoryId}
          onChange={(e) => setUploadCategoryId(e.target.value)}
          className="h-10 w-52 rounded-lg border border-border bg-card px-3 text-sm font-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentblue"
        >
          <option value="">{t("admin.bookNames.uploadCategoryPlaceholder")}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.ods"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadFile(file);
          }}
        />
        <Button
          variant="outline"
          size="sm"
          disabled={uploading || !uploadCategoryId}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={14} className="mr-1.5" />
          {uploading ? t("admin.bookNames.uploading") : t("admin.bookNames.uploadButton")}
        </Button>
        <p className="text-xs text-text-secondary">{t("admin.bookNames.uploadHint")}</p>
      </div>
      {uploadError && <p className="mb-3 text-sm text-brandred">{uploadError}</p>}
      {uploadResult && (
        <div className="mb-4 rounded-xl border border-border bg-card p-4 text-sm">
          <p className="font-medium text-navy">
            {t("admin.bookNames.uploadSummary")
              .replace("{created}", String(uploadResult.created))
              .replace("{skipped}", String(uploadResult.skippedDuplicates))}
          </p>
          {uploadResult.sheetsSkipped?.length > 0 && (
            <p className="mt-2 text-text-secondary">
              {t("admin.bookNames.sheetsSkipped").replace("{sheets}", uploadResult.sheetsSkipped.join(", "))}
            </p>
          )}
          {uploadResult.errors.length > 0 && (
            <ul className="mt-2 max-h-40 list-disc space-y-1 overflow-y-auto pl-5 text-brandred">
              {uploadResult.errors.map((e, i) => (
                <li key={i}>
                  {t("admin.bookNames.uploadRowError").replace("{row}", String(e.row)).replace("{reason}", e.reason)}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm text-text-secondary">
          {t("admin.bookNames.totalCount").replace("{count}", String(rows.length))}
        </p>
        <Button
          size="sm"
          variant="destructive"
          disabled={removingAll || rows.length === 0}
          onClick={() => setShowRemoveAllConfirm(true)}
        >
          {removingAll ? t("admin.bookNames.removingAll") : t("admin.bookNames.removeAll")}
        </Button>
      </div>

      {loading && <p className="rounded-xl border border-border bg-card p-6 text-center text-sm text-text-secondary">{t("action.loading")}</p>}

      {!loading && categories.length > 0 && (
        <div>
          <div className="mb-4 flex gap-2 border-b border-border">
            {categories.map((c) => {
              const count = rowsByCategory.get(c.id)?.length ?? 0;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveCategoryId(c.id)}
                  className={`border-b-2 px-3 py-2 text-sm font-medium ${
                    activeCategoryId === c.id ? "border-navy text-navy" : "border-transparent text-text-secondary"
                  }`}
                >
                  {c.name} ({count})
                </button>
              );
            })}
          </div>

          {(() => {
            const catRows = rowsByCategory.get(activeCategoryId) ?? [];
            if (catRows.length === 0) {
              return (
                <p className="rounded-xl border border-border bg-card p-6 text-center text-sm text-text-secondary">
                  {t("admin.bookNames.empty")}
                </p>
              );
            }
            return (
              <div className="max-h-[60vh] overflow-x-auto overflow-y-auto [overflow-y:overlay] rounded-xl border border-border bg-card">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 border-b border-border bg-card text-left text-text-secondary">
                    <tr>
                      <th className="p-3 font-medium">{t("admin.field.title")}</th>
                      <th className="p-3 font-medium">{t("admin.field.class")}</th>
                      <th className="p-3 font-medium">{t("admin.field.medium")}</th>
                      <th className="p-3 font-medium">{t("admin.field.author")}</th>
                      <th className="p-3 font-medium">{t("admin.bookNames.institutionHeader")}</th>
                      <th className="p-3 font-medium text-right">{t("admin.table.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {catRows.map((r) => (
                      <tr key={r.id} className="border-b border-border last:border-0">
                        <td className="p-3 font-medium">{r.name}</td>
                        <td className="p-3 text-text-secondary">{r.className ?? "—"}</td>
                        <td className="p-3 text-text-secondary">{r.medium ?? "—"}</td>
                        <td className="p-3 text-text-secondary">{r.author ?? "—"}</td>
                        <td className="p-3 text-text-secondary">{r.institution?.name ?? "—"}</td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-1.5">
                            <Button
                              size="icon"
                              variant="accent"
                              className="h-7 w-7"
                              disabled={busyId === r.id}
                              onClick={() => openEdit(r)}
                              aria-label={t("action.edit")}
                              title={t("action.edit")}
                            >
                              <Pencil size={14} />
                            </Button>
                            <Button
                              size="icon"
                              variant="destructive"
                              className="h-7 w-7"
                              disabled={busyId === r.id}
                              onClick={() => remove(r.id)}
                              aria-label={t("action.delete")}
                              title={t("action.delete")}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      )}

      <Dialog open={!!editingRow} onOpenChange={(o) => !o && setEditingRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.bookNames.editTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="eb-name">{t("admin.field.title")}</Label>
              <Input id="eb-name" className="mt-1.5" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="eb-class">{t("admin.field.class")}</Label>
                <Input id="eb-class" className="mt-1.5" value={editClassName} onChange={(e) => setEditClassName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="eb-medium">{t("admin.field.medium")}</Label>
                <Input id="eb-medium" className="mt-1.5" value={editMedium} onChange={(e) => setEditMedium(e.target.value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="eb-author">{t("admin.field.author")}</Label>
              <Input id="eb-author" className="mt-1.5" value={editAuthor} onChange={(e) => setEditAuthor(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="eb-institution">{t("admin.field.institution")}</Label>
              <Input id="eb-institution" className="mt-1.5" value={editInstitutionName} onChange={(e) => setEditInstitutionName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="eb-category">{t("admin.field.category")}</Label>
              <select
                id="eb-category"
                value={editCategoryId}
                onChange={(e) => setEditCategoryId(e.target.value)}
                className="mt-1.5 flex h-10 w-full rounded-lg border border-border bg-card px-3 text-sm font-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentblue"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            {editError && <p className="text-sm text-brandred">{editError}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setEditingRow(null)}>{t("action.cancel")}</Button>
              <Button disabled={editSaving || !editName.trim() || !editCategoryId} onClick={saveEdit}>
                {editSaving ? t("admin.bookNames.editSaving") : t("action.save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showRemoveAllConfirm} onOpenChange={(o) => !removingAll && setShowRemoveAllConfirm(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.bookNames.removeAllConfirmTitle")}</DialogTitle>
            <DialogDescription>
              {t("admin.bookNames.removeAllConfirmBody").replace("{count}", String(rows.length))}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" disabled={removingAll} onClick={() => setShowRemoveAllConfirm(false)}>
              {t("action.cancel")}
            </Button>
            <Button variant="destructive" disabled={removingAll} onClick={confirmRemoveAll}>
              {removingAll ? t("admin.bookNames.removingAll") : t("admin.bookNames.removeAllConfirmButton")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
