"use client";

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
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegistrationInput>({ resolver: zodResolver(registrationSchema) });

  async function onSubmit(data: RegistrationInput) {
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      setError("root", { message: t("register.genericError") });
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
      <div className="grid grid-cols-2 gap-4">
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
        <Input id="mobileNumber" placeholder="9876543210" className="mt-1.5" {...register("mobileNumber")} />
        {errors.mobileNumber && <p className="mt-1 text-xs text-brandred">{errors.mobileNumber.message}</p>}
      </div>

      <div>
        <Label htmlFor="institutionName">{t("register.institutionLabel")}</Label>
        <Input
          id="institutionName"
          placeholder={t("register.institutionPlaceholder")}
          className="mt-1.5"
          {...register("institutionName")}
        />
        {errors.institutionName && <p className="mt-1 text-xs text-brandred">{errors.institutionName.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
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

      {errors.root && <p className="text-sm text-brandred">{errors.root.message}</p>}

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? t("register.submitting") : t("register.submit")}
      </Button>
    </form>
  );
}
