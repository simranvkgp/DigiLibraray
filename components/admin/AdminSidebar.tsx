"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminSidebarNav, type AdminNavModule } from "@/components/admin/AdminSidebarNav";
import { PushNotificationToggle } from "@/components/admin/PushNotificationToggle";
import type { Lang } from "@/lib/i18n/translate";

export function AdminSidebar({
  modules,
  lang,
  brandLabel,
  logoutLabel,
  onSignOut,
}: {
  modules: AdminNavModule[];
  lang: Lang;
  brandLabel: string;
  logoutLabel: string;
  onSignOut: () => Promise<void>;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const content = (
    <div className="flex h-full flex-col bg-dash-navy">
      <div className="flex items-center gap-2.5 border-b border-white/10 px-6 py-6">
        <img src="/images/logo-sidebar.svg" alt={brandLabel} className="h-[52px] w-auto" />
      </div>
      <div className="flex-1 overflow-y-auto">
        <AdminSidebarNav modules={modules} />
      </div>
      <div className="px-3">
        <PushNotificationToggle lang={lang} />
      </div>
      <div className="p-3">
        <form action={onSignOut}>
          <Button
            variant="outline"
            size="sm"
            className="w-full border-white/20 bg-transparent text-white hover:bg-white/10"
            type="submit"
          >
            {logoutLabel}
          </Button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: fixed sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 lg:block">{content}</aside>

      {/* Mobile: floating menu trigger + slide-over drawer */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-dash-navy text-white shadow-lg lg:hidden"
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white"
              aria-label="Close menu"
            >
              <X size={16} />
            </button>
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
