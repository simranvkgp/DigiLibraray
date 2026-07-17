"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Moon,
  Sun,
  Bookmark,
  Download,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { translate, type Lang } from "@/lib/i18n/translate";

interface ReaderBook {
  id: string;
  title: string;
  subject: string;
  boardName: string;
  categoryName: string;
  fileType: string;
  pageCount: number | null;
  drivePreviewUrl: string;
  driveDownloadUrl: string;
}

interface BookmarkRow {
  id: string;
  pageNumber: number;
  note: string | null;
}

export function BookReader({
  book,
  initialPage,
  initialBookmarks,
  lang = "en",
}: {
  book: ReaderBook;
  initialPage: number;
  initialBookmarks: BookmarkRow[];
  lang?: Lang;
}) {
  const [page, setPage] = useState(initialPage || 1);
  const [zoom, setZoom] = useState(1);
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bookmarks, setBookmarks] = useState(initialBookmarks);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const totalPages = book.pageCount ?? undefined;
  const t = (key: string) => translate(lang, key);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const saveProgress = useCallback(
    (p: number) => {
      fetch("/api/reading-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: book.id, currentPage: p, totalPages }),
      }).catch(() => {});
    },
    [book.id, totalPages]
  );

  // Debounced save whenever the page changes.
  useEffect(() => {
    const t = setTimeout(() => saveProgress(page), 600);
    return () => clearTimeout(t);
  }, [page, saveProgress]);

  function goToPage(p: number) {
    const clamped = totalPages ? Math.max(1, Math.min(totalPages, p)) : Math.max(1, p);
    setPage(clamped);
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  async function addBookmark() {
    const res = await fetch("/api/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId: book.id, pageNumber: page }),
    });
    if (res.ok) {
      const { bookmark } = await res.json();
      setBookmarks((prev) => [...prev, bookmark].sort((a, b) => a.pageNumber - b.pageNumber));
      setSidebarOpen(true);
    }
  }

  async function removeBookmark(id: string) {
    await fetch("/api/bookmarks", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  }

  const isViewable = book.fileType === "PDF" || book.fileType === "FLIPBOOK" || book.fileType === "HTML";

  return (
    <div ref={containerRef} className={darkMode ? "bg-[#111827]" : "bg-background"}>
      {/* Top bar */}
      <div className={`flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 ${darkMode ? "border-white/10" : "border-border"}`}>
        <div className="min-w-0">
          <p className={`truncate font-display text-base font-medium ${darkMode ? "text-white" : "text-navy"}`}>{book.title}</p>
          <div className="mt-1 flex gap-1.5">
            <Badge variant="outline">{book.subject}</Badge>
            <Badge variant="default">{book.boardName}</Badge>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button size="icon" variant="ghost" onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))} aria-label={t("reader.zoomOut")}>
            <ZoomOut size={16} />
          </Button>
          <span className={`data-text w-12 text-center text-xs ${darkMode ? "text-white/70" : "text-text-secondary"}`}>
            {Math.round(zoom * 100)}%
          </span>
          <Button size="icon" variant="ghost" onClick={() => setZoom((z) => Math.min(2, z + 0.1))} aria-label={t("reader.zoomIn")}>
            <ZoomIn size={16} />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => setDarkMode((d) => !d)} aria-label={t("reader.toggleDarkMode")}>
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </Button>
          <Button size="icon" variant="ghost" onClick={toggleFullscreen} aria-label={t("reader.toggleFullscreen")}>
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </Button>
          <Button size="icon" variant="ghost" onClick={addBookmark} aria-label={t("reader.addBookmark")}>
            <Bookmark size={16} />
          </Button>
          <a href={book.driveDownloadUrl} target="_blank" rel="noreferrer">
            <Button size="icon" variant="ghost" aria-label={t("reader.download")}>
              <Download size={16} />
            </Button>
          </a>
          <Button size="sm" variant="outline" onClick={() => setSidebarOpen((s) => !s)}>
            {t("reader.bookmarks")} ({bookmarks.length})
          </Button>
        </div>
      </div>

      <div className="flex">
        {/* Viewer */}
        <div className="flex-1 overflow-auto p-6">
          {isViewable ? (
            <div
              className="mx-auto origin-top transition-transform"
              style={{ transform: `scale(${zoom})`, width: "800px" }}
            >
              <iframe
                key={page}
                src={`${book.drivePreviewUrl}#page=${page}`}
                className={`h-[1100px] w-full rounded-lg border ${darkMode ? "border-white/10 invert hue-rotate-180" : "border-border"}`}
                allow="autoplay"
              />
            </div>
          ) : (
            <div className="mx-auto max-w-md rounded-xl border border-dashed border-border bg-card p-10 text-center">
              <p className="font-display text-lg font-medium text-navy">{book.fileType} {t("reader.package")}</p>
              <p className="mt-2 text-sm text-text-secondary">
                {book.fileType} {t("reader.packageNotRenderable")}
              </p>
              <a href={book.driveDownloadUrl} target="_blank" rel="noreferrer" className="mt-4 inline-block">
                <Button>{t("reader.downloadPackage")}</Button>
              </a>
            </div>
          )}
        </div>

        {/* Bookmarks sidebar */}
        {sidebarOpen && (
          <aside className={`w-64 flex-shrink-0 border-l p-4 ${darkMode ? "border-white/10" : "border-border"}`}>
            <div className="mb-3 flex items-center justify-between">
              <p className={`text-sm font-medium ${darkMode ? "text-white" : "text-navy"}`}>{t("reader.bookmarks")}</p>
              <button onClick={() => setSidebarOpen(false)} aria-label={t("action.close")}>
                <X size={16} className={darkMode ? "text-white/70" : "text-text-secondary"} />
              </button>
            </div>
            {bookmarks.length === 0 && (
              <p className={`text-xs ${darkMode ? "text-white/50" : "text-text-secondary"}`}>{t("reader.noBookmarks")}</p>
            )}
            <div className="space-y-2">
              {bookmarks.map((b) => (
                <div key={b.id} className={`flex items-center justify-between rounded-lg px-2 py-1.5 ${darkMode ? "bg-white/5" : "bg-background"}`}>
                  <button onClick={() => goToPage(b.pageNumber)} className="data-text text-sm text-accentblue">
                    {t("reader.page")} {b.pageNumber}
                  </button>
                  <button onClick={() => removeBookmark(b.id)} aria-label={t("reader.removeBookmark")}>
                    <X size={14} className="text-text-secondary" />
                  </button>
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>

      {/* Bottom bar: page navigation */}
      {isViewable && (
        <div className={`flex items-center justify-center gap-4 border-t px-4 py-3 ${darkMode ? "border-white/10" : "border-border"}`}>
          <Button size="icon" variant="ghost" onClick={() => goToPage(page - 1)} disabled={page <= 1} aria-label={t("reader.previousPage")}>
            <ChevronLeft size={18} />
          </Button>
          <div className="data-text flex items-center gap-2 text-sm">
            <input
              type="number"
              value={page}
              onChange={(e) => goToPage(Number(e.target.value) || 1)}
              className={`w-14 rounded border px-2 py-1 text-center ${darkMode ? "border-white/20 bg-transparent text-white" : "border-border bg-card"}`}
            />
            <span className={darkMode ? "text-white/60" : "text-text-secondary"}>/ {totalPages ?? "—"}</span>
          </div>
          <Button size="icon" variant="ghost" onClick={() => goToPage(page + 1)} disabled={!!totalPages && page >= totalPages} aria-label={t("reader.nextPage")}>
            <ChevronRight size={18} />
          </Button>
        </div>
      )}
    </div>
  );
}
