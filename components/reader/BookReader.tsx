"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
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
  drivePreviewUrl: string | null; // only set (and only used) for non-PDF viewable types (FLIPBOOK/HTML)
  driveDownloadUrl: string; // only used for non-viewable package types (ZIP/SCORM)
}

interface BookmarkRow {
  id: string;
  pageNumber: number;
  note: string | null;
}

// Pages further than this from the current one get their canvas cleared to
// bound memory while scrolling through a long book — the placeholder div
// keeps its reserved height so scroll position doesn't jump.
const KEEP_RENDERED_RANGE = 5;

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
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const pageWrapperRefs = useRef<Array<HTMLDivElement | null>>([]);
  const canvasRefs = useRef<Array<HTMLCanvasElement | null>>([]);
  const pdfDocRef = useRef<PDFDocumentProxy | null>(null);
  const renderTasksRef = useRef<Map<number, RenderTask>>(new Map());
  const renderedAtZoomRef = useRef<Map<number, number>>(new Map());
  const intersectionRatiosRef = useRef<Map<number, number>>(new Map());
  const basePageSizeRef = useRef<{ width: number; height: number } | null>(null);
  const hasScrolledToInitialRef = useRef(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [numPages, setNumPages] = useState<number | null>(book.pageCount ?? null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const t = (key: string) => translate(lang, key);

  const isPdf = book.fileType === "PDF";
  const isViewable = isPdf || book.fileType === "FLIPBOOK" || book.fileType === "HTML";

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
        body: JSON.stringify({ bookId: book.id, currentPage: p, totalPages: numPages ?? undefined }),
      }).catch(() => {});
    },
    [book.id, numPages]
  );

  // Debounced save whenever the page changes.
  useEffect(() => {
    const timer = setTimeout(() => saveProgress(page), 600);
    return () => clearTimeout(timer);
  }, [page, saveProgress]);

  // Load the PDF once, entirely client-side, from our own authenticated
  // route — the raw Google Drive URL never reaches the browser.
  useEffect(() => {
    if (!isPdf) return;
    let cancelled = false;

    (async () => {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const res = await fetch(`/api/books/${book.id}/file`);
        if (!res.ok) throw new Error("Failed to fetch book file");
        const data = await res.arrayBuffer();
        if (cancelled) return;

        const doc = await pdfjsLib.getDocument({ data }).promise;
        if (cancelled) return;

        const firstPage = await doc.getPage(1);
        const baseViewport = firstPage.getViewport({ scale: 1 });
        basePageSizeRef.current = { width: baseViewport.width, height: baseViewport.height };

        pdfDocRef.current = doc;
        setNumPages(doc.numPages);
        setLoadState("ready");
      } catch {
        if (!cancelled) setLoadState("error");
      }
    })();

    return () => {
      cancelled = true;
      pdfDocRef.current?.destroy();
      pdfDocRef.current = null;
    };
  }, [isPdf, book.id]);

  // Renders (or re-renders, on zoom change) a single page's canvas.
  const renderPage = useCallback(
    async (pageNum: number) => {
      const doc = pdfDocRef.current;
      const canvas = canvasRefs.current[pageNum - 1];
      if (!doc || !canvas) return;
      if (renderedAtZoomRef.current.get(pageNum) === zoom) return;

      const pageProxy = await doc.getPage(pageNum);
      const viewport = pageProxy.getViewport({ scale: zoom * 1.5 });
      const context = canvas.getContext("2d");
      if (!context) return;

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      renderTasksRef.current.get(pageNum)?.cancel();
      const task = pageProxy.render({ canvasContext: context, viewport });
      renderTasksRef.current.set(pageNum, task);
      try {
        await task.promise;
        renderedAtZoomRef.current.set(pageNum, zoom);
      } catch {
        // Cancelled render (zoom changed mid-flight, or page scrolled away and got evicted) — safe to ignore.
      }
    },
    [zoom]
  );

  function evictFarPages(centerPage: number) {
    renderedAtZoomRef.current.forEach((_zoomRenderedAt, pageNum) => {
      if (Math.abs(pageNum - centerPage) > KEEP_RENDERED_RANGE) {
        const canvas = canvasRefs.current[pageNum - 1];
        if (canvas) {
          canvas.width = 0;
          canvas.height = 0;
        }
        renderedAtZoomRef.current.delete(pageNum);
      }
    });
  }

  // Continuous-scroll rendering: watch every page slot, render whichever
  // scroll near the visible area, and track the most-visible one as the
  // "current" page (for the page indicator, bookmarks, and reading progress).
  useEffect(() => {
    if (!isPdf || loadState !== "ready" || !numPages || !scrollAreaRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const pageNum = Number((entry.target as HTMLElement).dataset.page);
          intersectionRatiosRef.current.set(pageNum, entry.isIntersecting ? entry.intersectionRatio : 0);
          if (entry.isIntersecting) renderPage(pageNum);
        });

        let bestPage: number | null = null;
        let bestRatio = 0;
        intersectionRatiosRef.current.forEach((ratio, pageNum) => {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestPage = pageNum;
          }
        });

        if (bestPage !== null) {
          setPage((prev) => (prev === bestPage ? prev : (bestPage as number)));
          evictFarPages(bestPage);
        }
      },
      { root: scrollAreaRef.current, rootMargin: "800px 0px", threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] }
    );

    pageWrapperRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [isPdf, loadState, numPages, renderPage]);

  // Jump to the reader's last reading position once, after the page list mounts.
  useEffect(() => {
    if (!isPdf || loadState !== "ready" || hasScrolledToInitialRef.current) return;
    const target = pageWrapperRefs.current[(initialPage || 1) - 1];
    if (target) {
      target.scrollIntoView({ block: "start" });
      hasScrolledToInitialRef.current = true;
    }
  }, [isPdf, loadState, initialPage]);

  function scrollToPage(p: number) {
    const clamped = numPages ? Math.max(1, Math.min(numPages, p)) : Math.max(1, p);
    pageWrapperRefs.current[clamped - 1]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  async function removeBookmark(id: string) {
    await fetch("/api/bookmarks", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  }

  async function toggleBookmark(pageNumber: number) {
    const existing = bookmarks.find((b) => b.pageNumber === pageNumber);
    if (existing) {
      await removeBookmark(existing.id);
      return;
    }
    const res = await fetch("/api/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId: book.id, pageNumber }),
    });
    if (res.ok) {
      const { bookmark } = await res.json();
      setBookmarks((prev) => [...prev, bookmark].sort((a, b) => a.pageNumber - b.pageNumber));
      setSidebarOpen(true);
    }
  }

  const bookmarkedPages = new Set(bookmarks.map((b) => b.pageNumber));

  // Best-effort deterrents against saving/printing/copying the page. None of
  // this can stop a screenshot, screen recording, or someone reading the
  // network response directly — that's a hard ceiling for any browser-based
  // viewer, not a gap specific to this implementation.
  useEffect(() => {
    if (!isPdf) return;
    const node = containerRef.current;
    if (!node) return;

    const blockContextMenu = (e: MouseEvent) => e.preventDefault();
    const blockKeys = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && ["p", "s", "c"].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };
    const blockDrag = (e: DragEvent) => e.preventDefault();

    node.addEventListener("contextmenu", blockContextMenu);
    node.addEventListener("keydown", blockKeys);
    node.addEventListener("dragstart", blockDrag);
    return () => {
      node.removeEventListener("contextmenu", blockContextMenu);
      node.removeEventListener("keydown", blockKeys);
      node.removeEventListener("dragstart", blockDrag);
    };
  }, [isPdf]);

  const estimatedPageHeight = basePageSizeRef.current ? basePageSizeRef.current.height * zoom * 1.5 : undefined;

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      className={darkMode ? "bg-[#111827]" : "bg-background"}
      style={isPdf ? { userSelect: "none" } : undefined}
    >
      {/* Top bar */}
      <div className={`flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 print:hidden ${darkMode ? "border-white/10" : "border-border"}`}>
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
          <Button
            size="icon"
            variant="ghost"
            onClick={() => toggleBookmark(page)}
            aria-label={t(bookmarkedPages.has(page) ? "reader.removeBookmark" : "reader.addBookmark")}
          >
            <Bookmark size={16} fill={bookmarkedPages.has(page) ? "currentColor" : "none"} />
          </Button>
          <Button size="sm" variant="outline" onClick={() => setSidebarOpen((s) => !s)}>
            {t("reader.bookmarks")} ({bookmarks.length})
          </Button>
        </div>
      </div>

      <div className="flex">
        {/* Bookmarks sidebar */}
        {sidebarOpen && (
          <aside className={`w-64 flex-shrink-0 border-r p-4 print:hidden ${darkMode ? "border-white/10" : "border-border"}`}>
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
                  <button onClick={() => (isPdf ? scrollToPage(b.pageNumber) : setPage(b.pageNumber))} className="data-text text-sm text-accentblue">
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

        {/* Viewer */}
        <div ref={scrollAreaRef} className="flex-1 overflow-auto p-6">
          {isPdf ? (
            <>
              {loadState === "loading" && (
                <p className={`py-20 text-center text-sm ${darkMode ? "text-white/70" : "text-text-secondary"}`}>
                  {t("reader.loading")}
                </p>
              )}
              {loadState === "error" && (
                <p className="py-20 text-center text-sm text-brandred">{t("reader.loadError")}</p>
              )}
              {loadState === "ready" && numPages && (
                <div className="print:hidden">
                  {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
                    <div
                      key={pageNum}
                      ref={(el) => {
                        pageWrapperRefs.current[pageNum - 1] = el;
                      }}
                      data-page={pageNum}
                      className="relative mx-auto mb-4"
                      style={{ minHeight: estimatedPageHeight }}
                    >
                      <button
                        onClick={() => toggleBookmark(pageNum)}
                        aria-label={t(bookmarkedPages.has(pageNum) ? "reader.removeBookmark" : "reader.addBookmark")}
                        className={`absolute right-2 top-2 z-10 rounded-full p-1.5 transition-colors ${
                          bookmarkedPages.has(pageNum)
                            ? "bg-accentblue text-white"
                            : "bg-black/40 text-white/70 hover:bg-black/60 hover:text-white"
                        }`}
                      >
                        <Bookmark size={14} fill={bookmarkedPages.has(pageNum) ? "currentColor" : "none"} />
                      </button>
                      <canvas
                        ref={(el) => {
                          canvasRefs.current[pageNum - 1] = el;
                        }}
                        className={`mx-auto block rounded-lg border ${darkMode ? "border-white/10 invert hue-rotate-180" : "border-border"}`}
                        onDragStart={(e) => e.preventDefault()}
                      />
                    </div>
                  ))}
                </div>
              )}
              <p className="hidden py-20 text-center text-sm print:block">{t("reader.printDisabled")}</p>
            </>
          ) : isViewable ? (
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
      </div>

      {/* Bottom bar: page navigation */}
      {isViewable && (
        <div className={`flex items-center justify-center gap-4 border-t px-4 py-3 print:hidden ${darkMode ? "border-white/10" : "border-border"}`}>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => (isPdf ? scrollToPage(page - 1) : setPage((p) => Math.max(1, p - 1)))}
            disabled={page <= 1}
            aria-label={t("reader.previousPage")}
          >
            <ChevronLeft size={18} />
          </Button>
          <div className="data-text flex items-center gap-2 text-sm">
            <input
              type="number"
              value={page}
              onChange={(e) => {
                const p = Number(e.target.value) || 1;
                if (isPdf) scrollToPage(p);
                else setPage(numPages ? Math.max(1, Math.min(numPages, p)) : Math.max(1, p));
              }}
              className={`w-14 rounded border px-2 py-1 text-center ${darkMode ? "border-white/20 bg-transparent text-white" : "border-border bg-card"}`}
            />
            <span className={darkMode ? "text-white/60" : "text-text-secondary"}>/ {numPages ?? "—"}</span>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => (isPdf ? scrollToPage(page + 1) : setPage((p) => (numPages ? Math.min(numPages, p + 1) : p + 1)))}
            disabled={!!numPages && page >= numPages}
            aria-label={t("reader.nextPage")}
          >
            <ChevronRight size={18} />
          </Button>
        </div>
      )}
    </div>
  );
}
