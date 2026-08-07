"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registrationSchema, type RegistrationInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { translate, type Lang } from "@/lib/i18n/translate";

export function RegistrationForm({
  name,
  email,
  lang = "en",
}: {
  name: string;
  email: string;
  lang?: Lang;
}) {
  const { update } = useSession();
  const t = (key: string) => translate(lang, key);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegistrationInput>({ resolver: zodResolver(registrationSchema) });

  const idCardUrl = watch("idCardUrl");

  async function handleIdCardChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload/id-card", { method: "POST", body: formData });
    setUploading(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setUploadError(typeof err.error === "string" ? err.error : t("register.idCardUploadError"));
      return;
    }
    const { url } = await res.json();
    setValue("idCardUrl", url, { shouldValidate: true });
  }

  async function onSubmit(data: RegistrationInput) {
    if (!data.idCardUrl) {
      setError("idCardUrl", { message: t("register.idCardRequired") });
      return;
    }

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      const validationError = errorBody?.error;

      if (validationError?.fieldErrors) {
        for (const field of Object.keys(validationError.fieldErrors)) {
          const message = validationError.fieldErrors[field]?.[0];
          if (message) {
            setError(field as keyof RegistrationInput, { message });
          }
        }
      } else if (typeof validationError === "string") {
        setError("root", { message: validationError });
      } else {
        setError("root", { message: t("register.genericError") });
      }

      return;
    }

    // The session cookie still has the pre-registration approvalStatus baked
    // in; refresh it so middleware doesn't bounce us back to /register.
    // `update()` with no argument is a no-op GET — passing a (even empty)
    // payload is what makes next-auth POST and actually re-derive the JWT.
    await update({});
    // A hard navigation guarantees this request carries the just-refreshed
    // cookie and re-runs middleware from scratch (see CategoryPicker for why
    // router.push + router.refresh() is unreliable here).
    window.location.href = "/pending-approval";
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>{t("register.nameLabel")}</Label>
          <Input value={name} disabled className="mt-1.5 bg-background" />
        </div>
        <div>
          <Label>{t("register.emailLabel")}</Label>
          <Input value={email} disabled className="mt-1.5 bg-background" />
        </div>
      </div>

      <div>
        <Label htmlFor="mobileNumber">{t("register.mobileLabel")}</Label>
        <Input id="mobileNumber" className="mt-1.5" {...register("mobileNumber")} />
        {errors.mobileNumber && <p className="mt-1 text-xs text-brandred">{errors.mobileNumber.message}</p>}
      </div>

      <div>
        <Label htmlFor="institutionName">{t("register.institutionLabel")}</Label>
        <Input
          id="institutionName"
          className="mt-1.5"
          {...register("institutionName")}
        />
        {errors.institutionName && <p className="mt-1 text-xs text-brandred">{errors.institutionName.message}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="city">{t("register.cityLabel")}</Label>
          <Input id="city" className="mt-1.5" {...register("city")} />
          {errors.city && <p className="mt-1 text-xs text-brandred">{errors.city.message}</p>}
        </div>
        <div>
          <Label htmlFor="state">{t("register.stateLabel")}</Label>
          <Input id="state" className="mt-1.5" {...register("state")} />
          {errors.state && <p className="mt-1 text-xs text-brandred">{errors.state.message}</p>}
        </div>
      </div>

      <div>
        <input type="hidden" {...register("idCardUrl")} />
        <Label>{t("register.idCardLabel")}</Label>
        <p className="mt-0.5 text-xs text-text-secondary">{t("register.idCardHint")}</p>
        <div className="mt-1.5 flex items-center gap-3">
          <label className="cursor-pointer rounded-lg border border-border px-3 py-2 text-sm text-text-secondary hover:border-navy hover:text-navy">
            {uploading ? t("register.idCardUploading") : t("register.idCardUpload")}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              disabled={uploading}
              onChange={handleIdCardChange}
            />
          </label>
          {idCardUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={idCardUrl} alt="" className="h-10 w-16 rounded object-cover" />
          )}
        </div>
        {uploadError && <p className="mt-1 text-xs text-brandred">{uploadError}</p>}
        {errors.idCardUrl && <p className="mt-1 text-xs text-brandred">{errors.idCardUrl.message}</p>}
      </div>

      {errors.root && <p className="text-sm text-brandred">{errors.root.message}</p>}

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? t("register.submitting") : t("register.submit")}
      </Button>
    </form>
  );
}
