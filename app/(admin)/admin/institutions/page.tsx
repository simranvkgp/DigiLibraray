"use client";

import { useEffect, useState } from "react";
import { translate, type Lang } from "@/lib/i18n/translate";

interface InstitutionRow {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  _count: { users: number };
}

export default function AdminInstitutionsPage() {
  const [institutions, setInstitutions] = useState<InstitutionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<Lang>("en");
  const t = (key: string) => translate(lang, key);

  useEffect(() => {
    fetch("/api/admin/institutions").then((r) => r.json()).then((d) => setInstitutions(d.institutions ?? [])).finally(() => setLoading(false));
    fetch("/api/settings").then((r) => r.json()).then((d) => {
      if (d.settings?.language === "hi") setLang("hi");
    });
  }, []);

  return (
    <div className="p-8">
      <h1 className="font-display text-2xl font-medium text-navy">{t("admin.nav.institutions")}</h1>
      <p className="mt-1 text-sm text-text-secondary">{t("admin.institutions.subtitle")}</p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-text-secondary">
            <tr>
              <th className="p-3 font-medium">{t("admin.field.institution")}</th>
              <th className="p-3 font-medium">{t("admin.institutions.col.city")}</th>
              <th className="p-3 font-medium">{t("admin.institutions.col.state")}</th>
              <th className="p-3 font-medium">{t("admin.nav.users")}</th>
            </tr>
          </thead>
          <tbody>
            {!loading && institutions.map((i) => (
              <tr key={i.id} className="border-b border-border last:border-0">
                <td className="p-3 font-medium">{i.name}</td>
                <td className="p-3">{i.city ?? "—"}</td>
                <td className="p-3">{i.state ?? "—"}</td>
                <td className="p-3 data-text">{i._count.users}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <p className="p-6 text-center text-sm text-text-secondary">{t("action.loading")}</p>}
        {!loading && institutions.length === 0 && <p className="p-6 text-center text-sm text-text-secondary">{t("admin.institutions.empty")}</p>}
      </div>
    </div>
  );
}
