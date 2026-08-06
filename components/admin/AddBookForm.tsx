"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { bookFormSchema, type BookFormInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { translate, type Lang } from "@/lib/i18n/translate";

interface Option { id: string; name: string }

export function AddBookForm({ onCreated, lang = "en" }: { onCreated: () => void; lang?: Lang }) {
  const [categories, setCategories] = useState<Option[]>([]);
  const [boards, setBoards] = useState<Option[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const t = (key: string) => translate(lang, key);

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then((d) => setCategories(d.categories ?? []));
    fetch("/api/boards").then((r) => r.json()).then((d) => setBoards(d.boards ?? []));
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BookFormInput>({
    resolver: zodResolver(bookFormSchema),
    defaultValues: { version: "1.0", fileType: "PDF" },
  });

  const coverImageUrl = watch("coverImageUrl");

  async function handleCoverFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
    setUploading(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setUploadError(typeof err.error === "string" ? err.error : t("admin.books.form.uploadError"));
      return;
    }
    const { url } = await res.json();
    setValue("coverImageUrl", url, { shouldValidate: true });
  }

  async function onSubmit(data: BookFormInput) {
    setServerError(null);
    const res = await fetch("/api/books", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setServerError(typeof err.error === "string" ? err.error : t("admin.books.form.error"));
      return;
    }
    reset();
    onCreated();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="col-span-1 sm:col-span-2">
        <Label htmlFor="driveShareUrl">{t("admin.books.form.driveLink")}</Label>
        <Input id="driveShareUrl" placeholder="https://drive.google.com/file/d/.../view?usp=sharing" className="mt-1.5" {...register("driveShareUrl")} />
        {errors.driveShareUrl && <p className="mt-1 text-xs text-brandred">{errors.driveShareUrl.message}</p>}
      </div>

      <div>
        <Label htmlFor="title">{t("admin.field.title")}</Label>
        <Input id="title" className="mt-1.5" {...register("title")} />
        {errors.title && <p className="mt-1 text-xs text-brandred">{errors.title.message}</p>}
      </div>
      <div>
        <Label htmlFor="medium">{t("admin.field.medium")}</Label>
        <select id="medium" className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm" {...register("subject")}> 
          <option value="">{t("admin.common.selectPlaceholder")}</option>
          <option value="Hindi">Hindi</option>
          <option value="Punjabi">Punjabi</option>
          <option value="English">English</option>
        </select>
        {errors.subject && <p className="mt-1 text-xs text-brandred">{errors.subject.message}</p>}
      </div>

      <div>
        <Label htmlFor="author">{t("admin.field.author")}</Label>
        <Input id="author" className="mt-1.5" {...register("author")} />
        {errors.author && <p className="mt-1 text-xs text-brandred">{errors.author.message}</p>}
      </div>

      <div>
        <Label htmlFor="categoryId">{t("admin.field.category")}</Label>
        <select id="categoryId" className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm" {...register("categoryId")}>
          <option value="">{t("admin.common.selectPlaceholder")}</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {errors.categoryId && <p className="mt-1 text-xs text-brandred">{errors.categoryId.message}</p>}
      </div>
      <div>
        <Label htmlFor="boardId">{t("admin.field.board")}</Label>
        <select id="boardId" className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm" {...register("boardId")}>
          <option value="">{t("admin.common.selectPlaceholder")}</option>
          {boards.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        {errors.boardId && <p className="mt-1 text-xs text-brandred">{errors.boardId.message}</p>}
      </div>

      <div>
        <Label htmlFor="className">{t("admin.books.form.classSemester")}</Label>
        <Input id="className" className="mt-1.5" {...register("className")} />
      </div>
      <div>
        <Label htmlFor="fileType">{t("admin.field.fileType")}</Label>
        <select id="fileType" className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm" {...register("fileType")}>
          {["PDF", "ZIP", "HTML", "FLIPBOOK", "SCORM"].map((tp) => <option key={tp} value={tp}>{tp}</option>)}
        </select>
      </div>

      <div className="col-span-1 sm:col-span-2">
        <Label htmlFor="description">{t("admin.field.description")}</Label>
        <Input id="description" className="mt-1.5" {...register("description")} />
      </div>

      <div className="col-span-1 sm:col-span-2">
        <Label htmlFor="coverImageUrl">{t("admin.books.form.coverImageUrl")}</Label>
        <div className="mt-1.5 flex items-center gap-3">
          <Input id="coverImageUrl" placeholder="https://..." className="flex-1" {...register("coverImageUrl")} />
          <span className="text-xs text-text-secondary">{t("admin.books.form.or")}</span>
          <label className="cursor-pointer rounded-lg border border-border px-3 py-2 text-sm text-text-secondary hover:border-navy hover:text-navy">
            {uploading ? t("admin.books.form.uploading") : t("admin.books.form.uploadImage")}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              disabled={uploading}
              onChange={handleCoverFileChange}
            />
          </label>
          {coverImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverImageUrl} alt="" className="h-10 w-10 rounded object-cover" />
          )}
        </div>
        {uploadError && <p className="mt-1 text-xs text-brandred">{uploadError}</p>}
        {errors.coverImageUrl && <p className="mt-1 text-xs text-brandred">{errors.coverImageUrl.message}</p>}
      </div>
      <div>
        <Label htmlFor="pageCount">{t("admin.books.form.pageCount")}</Label>
        <Input id="pageCount" type="number" className="mt-1.5" {...register("pageCount")} />
      </div>

      {serverError && <p className="col-span-1 text-sm text-brandred sm:col-span-2">{serverError}</p>}

      <div className="col-span-1 sm:col-span-2">
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? t("admin.books.form.adding") : t("admin.books.addNew")}
        </Button>
      </div>
    </form>
  );
}
