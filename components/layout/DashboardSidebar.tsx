"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Library,
  Sparkles,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { translate, type Lang } from "@/lib/i18n/translate";

const rowBase =
  "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white";
const rowActive = "bg-dash-blue text-white shadow-sm";

export function DashboardSidebar({ lang = "en" }: { lang?: Lang }) {
  const t = (key: string) => translate(lang, key);
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [newArrivalsCount, setNewArrivalsCount] = useState(0);

  useEffect(() => {
    fetch("/api/new-arrivals")
      .then((r) => r.json())
      .then((d) => setNewArrivalsCount(d.count ?? 0))
      .catch(() => {});
  }, [pathname]);

  function markNewArrivalsSeen() {
    setNewArrivalsCount(0);
    fetch("/api/new-arrivals", { method: "POST" }).catch(() => {});
  }

  const content = (
    <div className="flex h-full flex-col bg-dash-navy">
      <div className="flex items-center gap-2.5 border-b border-white/10 px-6 py-6">
        <img src="/images/logo-sidebar.svg" alt="VK Digital Library" className="h-[52px] w-auto" />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
        <Link href="/dashboard" className={`${rowBase} ${pathname === "/dashboard" ? rowActive : ""}`}>
          <LayoutDashboard size={18} aria-hidden="true" />
          {t("dashboard.sidebar.dashboard")}
        </Link>
        <Link href="/library" className={`${rowBase} ${pathname === "/library" ? rowActive : ""}`}>
          <Library size={18} aria-hidden="true" />
          {t("dashboard.sidebar.myLibrary")}
        </Link>
        <Link href="/library" className={rowBase} onClick={markNewArrivalsSeen}>
          <Sparkles size={18} aria-hidden="true" />
          <span className="flex-1">{t("dashboard.sidebar.newArrivals")}</span>
          {newArrivalsCount > 0 && (
            <span className="rounded-full bg-brandred px-2 py-0.5 text-[10px] font-semibold text-white">
              {newArrivalsCount}
            </span>
          )}
        </Link>
        <Link href="/settings" className={`${rowBase} ${pathname === "/settings" ? rowActive : ""}`}>
          <Settings size={18} aria-hidden="true" />
          {t("dashboard.sidebar.settings")}
        </Link>
      </nav>

      <div className="border-t border-white/10 px-6 py-4">
        <p className="text-[11px] text-white/40">© {new Date().getFullYear()} VK Global Group</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: fixed sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">{content}</aside>

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
