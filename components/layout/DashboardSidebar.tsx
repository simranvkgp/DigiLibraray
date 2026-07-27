"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Library,
  Sparkles,
  Bookmark as BookmarkIcon,
  ClipboardList,
  Settings,
  Mail,
  Menu,
  X,
  BookOpen,
} from "lucide-react";
import { RequestBookHeroButton } from "@/components/dashboard/RequestBookHeroButton";
import { translate, type Lang } from "@/lib/i18n/translate";
import { openContactPopup } from "@/lib/utils";

const rowBase =
  "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white";
const rowActive = "bg-dash-blue text-white shadow-sm";
const rowDisabled = "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-white/30 cursor-not-allowed";

export function DashboardSidebar({ lang = "en" }: { lang?: Lang }) {
  const t = (key: string) => translate(lang, key);
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bookmarkCount, setBookmarkCount] = useState(0);

  useEffect(() => {
    fetch("/api/bookmarks")
      .then((r) => r.json())
      .then((d) => setBookmarkCount(d.bookmarks?.length ?? 0))
      .catch(() => {});
  }, [pathname]);

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
        <Link href="/library" className={rowBase}>
          <Sparkles size={18} aria-hidden="true" />
          {t("dashboard.sidebar.newArrivals")}
        </Link>
        {bookmarkCount > 0 ? (
          <Link href="/bookmarks" className={`${rowBase} ${pathname === "/bookmarks" ? rowActive : ""}`}>
            <BookmarkIcon size={18} aria-hidden="true" />
            <span className="flex-1">{t("dashboard.sidebar.bookmarks")}</span>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white">
              {bookmarkCount}
            </span>
          </Link>
        ) : (
          <div className={rowDisabled} aria-disabled="true" title={t("dashboard.sidebar.noBookmarksYet")}>
            <BookmarkIcon size={18} aria-hidden="true" />
            <span className="flex-1">{t("dashboard.sidebar.bookmarks")}</span>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/50">
              {t("dashboard.sidebar.noBookmarksYet")}
            </span>
          </div>
        )}
        <RequestBookHeroButton lang={lang} triggerClassName={`${rowBase} w-full text-left`}>
          <ClipboardList size={18} aria-hidden="true" />
          {t("dashboard.sidebar.myRequests")}
        </RequestBookHeroButton>
        <Link href="/settings" className={`${rowBase} ${pathname === "/settings" ? rowActive : ""}`}>
          <Settings size={18} aria-hidden="true" />
          {t("dashboard.sidebar.settings")}
        </Link>
      </nav>

      <div className="mx-4 mb-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-dash-gold/15">
          <BookOpen className="h-5 w-5 text-dash-gold" aria-hidden="true" />
        </div>
        <p className="mt-3 font-display text-sm font-semibold text-white">{t("dashboard.sidebar.promoTitle")}</p>
        <p className="mt-1 text-xs leading-relaxed text-white/60">{t("dashboard.sidebar.promoBody")}</p>
        <p className="mt-3 text-xs leading-relaxed text-white/60">{t("dashboard.sidebar.queryPrompt")}</p>
        <button
          onClick={openContactPopup}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-dash-gold px-4 py-2 text-xs font-semibold text-dash-navy transition-colors hover:bg-dash-gold/90"
        >
          <Mail size={14} aria-hidden="true" />
          {t("footer.contactUs")}
        </button>
      </div>

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
