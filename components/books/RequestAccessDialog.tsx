"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { bookRequestSchema, type BookRequestInput } from "@/lib/validations";
import { translate, type Lang } from "@/lib/i18n/translate";
import type { BookRequestStatus } from "@/types";

export function RequestAccessDialog({
  book,
  lang = "en",
  requestStatus,
  onChange,
}: {
  book: { id: string; title: string };
  lang?: Lang;
  requestStatus: BookRequestStatus;
  onChange?: (status: BookRequestStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const t = (key: string) => translate(lang, key);
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<BookRequestInput>({ resolver: zodResolver(bookRequestSchema), defaultValues: { bookId: book.id } });
  const [errorMessage, setErrorMessage] = useState("");

  function getErrorMessage(payload: unknown) {
    if (!payload || typeof payload !== "object") return t("requestDialog.error");
    const anyPayload = payload as Record<string, unknown>;
    const { error } = anyPayload;
    if (typeof error === "string") return error;
    if (typeof error === "object" && error !== null) {
      if (typeof (error as Record<string, unknown>).message === "string") {
        return (error as Record<string, string>).message;
      }
      const fieldErrors = (error as Record<string, unknown>).fieldErrors;
      if (fieldErrors && typeof fieldErrors === "object") {
        return Object.values(fieldErrors)
          .flatMap((value) => (Array.isArray(value) ? value : [value]))
          .filter((value): value is string => typeof value === "string")
          .join(" \n");
      }
      const formErrors = (error as Record<string, unknown>).formErrors;
      if (formErrors && Array.isArray(formErrors)) {
        return formErrors.filter((value): value is string => typeof value === "string").join(" \n");
      }
      return JSON.stringify(error);
    }
    return t("requestDialog.error");
  }

  async function onSubmit(data: BookRequestInput) {
    setErrorMessage("");
    const res = await fetch("/api/book-requests", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId: book.id, note: data.note }),
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      setErrorMessage(getErrorMessage(payload));
      return;
    }
    onChange?.("PENDING");
    reset();
    setOpen(false);
  }

  if (requestStatus === "PENDING") {
    return (
      <Button size="sm" variant="outline" disabled className="mt-3 w-fit gap-1.5">
        <Lock size={14} />
        {t("library.requestPending")}
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="mt-3 w-fit gap-1.5">
          <Lock size={14} />
          {requestStatus === "REJECTED" ? t("library.requestAgain") : t("library.requestAccess")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("requestDialog.title")}</DialogTitle>
          <DialogDescription>{book.title}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="note">{t("requestDialog.noteLabel")}</Label>
            <textarea
              id="note"
              rows={3}
              placeholder={t("requestDialog.notePlaceholder")}
              className="mt-1.5 flex w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-body placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentblue"
              {...register("note")}
            />
          </div>
          {errorMessage && <p className="text-sm text-brandred">{errorMessage}</p>}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? t("requestDialog.submitting") : t("requestDialog.submit")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
