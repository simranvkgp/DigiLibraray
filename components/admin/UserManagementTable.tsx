"use client";

import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { translate, type Lang } from "@/lib/i18n/translate";

interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  mobileNumber: string | null;
  institution: string;
  category: string;
  board: string;
  approvalStatus: string;
  createdAt: string;
  lastLoginAt: string | null;
  booksRead: number;
}

const statusVariant: Record<string, "default" | "success" | "warning" | "destructive"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
  SUSPENDED: "destructive",
  INCOMPLETE: "default",
};

const statusKey: Record<string, string> = {
  PENDING: "admin.status.pending",
  APPROVED: "admin.status.approved",
  REJECTED: "admin.status.rejected",
  SUSPENDED: "admin.status.suspended",
  INCOMPLETE: "admin.status.incomplete",
};

export function UserManagementTable({ lang = "en", canManageRoles = false }: { lang?: Lang; canManageRoles?: boolean }) {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const t = (key: string) => translate(lang, key);

  const load = useCallback(() => {
    setLoading(true);
    const qs = filter ? `?status=${filter}` : "";
    fetch(`/api/admin/users${qs}`)
      .then((r) => r.json())
      .then((data) => setUsers(data.users ?? []))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function act(id: string, action: "approve" | "reject" | "suspend" | "reactivate", method: "POST" | "DELETE" = "POST") {
    setBusyId(id);
    await fetch(`/api/admin/users/${id}/${action}`, { method });
    await load();
    setBusyId(null);
  }

  async function remove(id: string) {
    if (!confirm(t("admin.users.confirmDelete"))) return;
    setBusyId(id);
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    await load();
    setBusyId(null);
  }

  async function setRole(id: string, role: "ADMIN" | "USER") {
    setBusyId(id);
    await fetch(`/api/admin/users/${id}/role`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    await load();
    setBusyId(null);
  }

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {["", "PENDING", "APPROVED", "REJECTED", "SUSPENDED"].map((s) => (
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
              <th className="p-3 font-medium">{t("admin.users.col.name")}</th>
              <th className="hidden p-3 font-medium md:table-cell">{t("admin.field.institution")}</th>
              <th className="hidden p-3 font-medium md:table-cell">{t("admin.table.categoryBoard")}</th>
              <th className="p-3 font-medium">{t("admin.users.col.role")}</th>
              <th className="p-3 font-medium">{t("admin.table.status")}</th>
              <th className="hidden p-3 font-medium lg:table-cell">{t("admin.users.col.booksRead")}</th>
              <th className="p-3 font-medium text-right">{t("admin.table.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {!loading &&
              users.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="p-3">
                    <p className="font-medium">{u.name}</p>
                    <p className="text-xs text-text-secondary">{u.email}</p>
                    {u.mobileNumber && <p className="text-xs text-text-secondary">{u.mobileNumber}</p>}
                  </td>
                  <td className="hidden p-3 md:table-cell">{u.institution}</td>
                  <td className="hidden p-3 md:table-cell">{u.category} / {u.board}</td>
                  <td className="p-3">
                    <Badge variant={u.role === "SUPER_ADMIN" ? "success" : u.role === "ADMIN" ? "warning" : "default"}>
                      {u.role === "SUPER_ADMIN" ? t("admin.users.role.superAdmin") : u.role === "ADMIN" ? t("admin.users.role.admin") : t("admin.users.role.user")}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <Badge variant={statusVariant[u.approvalStatus] ?? "default"}>
                      {statusKey[u.approvalStatus] ? t(statusKey[u.approvalStatus]) : u.approvalStatus}
                    </Badge>
                  </td>
                  <td className="hidden p-3 data-text lg:table-cell">{u.booksRead}</td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      {u.approvalStatus === "PENDING" && (
                        <>
                          <Button size="sm" variant="success" disabled={busyId === u.id} onClick={() => act(u.id, "approve")}>{t("admin.users.approve")}</Button>
                          <Button size="sm" variant="destructive" disabled={busyId === u.id} onClick={() => act(u.id, "reject")}>{t("admin.users.reject")}</Button>
                        </>
                      )}
                      {u.approvalStatus === "APPROVED" && (
                        <Button size="sm" variant="outline" disabled={busyId === u.id} onClick={() => act(u.id, "suspend")}>{t("admin.users.suspend")}</Button>
                      )}
                      {u.approvalStatus === "SUSPENDED" && (
                        <Button size="sm" variant="success" disabled={busyId === u.id} onClick={() => act(u.id, "reactivate")}>{t("admin.users.reactivate")}</Button>
                      )}
                      {u.approvalStatus === "REJECTED" && (
                        <Button size="sm" variant="success" disabled={busyId === u.id} onClick={() => act(u.id, "approve")}>{t("admin.users.approve")}</Button>
                      )}
                      {canManageRoles && u.role === "USER" && (
                        <Button size="sm" variant="outline" disabled={busyId === u.id} onClick={() => setRole(u.id, "ADMIN")}>{t("admin.users.makeAdmin")}</Button>
                      )}
                      {canManageRoles && u.role === "ADMIN" && (
                        <Button size="sm" variant="outline" disabled={busyId === u.id} onClick={() => setRole(u.id, "USER")}>{t("admin.users.removeAdmin")}</Button>
                      )}
                      <Button size="sm" variant="ghost" disabled={busyId === u.id} onClick={() => remove(u.id)}>{t("action.delete")}</Button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        {loading && <p className="p-6 text-center text-sm text-text-secondary">{t("action.loading")}</p>}
        {!loading && users.length === 0 && <p className="p-6 text-center text-sm text-text-secondary">{t("admin.users.empty")}</p>}
      </div>
    </div>
  );
}
