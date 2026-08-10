"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Bookmark,
  BookMarked,
  Heart,
  Highlighter,
  PanelRight,
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

interface FavoriteRow {
  id: string;
  pageNumber: number | null;
}

interface HighlightRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface HighlightRow {
  id: string;
  pageNumber: number;
  text: string;
  rects: HighlightRect[];
  color: string;
}

// Thumbnails render at a fixed width regardless of zoom — small enough that
// keeping every rendered one in memory (no eviction, unlike full pages) is fine.
const THUMB_WIDTH = 110;

// Pages further than this from the current one get their canvas cleared to
// bound memory while scrolling through a long book — the placeholder div
// keeps its reserved height so scroll position doesn't jump.
const KEEP_RENDERED_RANGE = 5;

export function BookReader({
  book,
  initialPage,
  initialBookmarks,
  initialFavorites,
  initialHighlights,
  lang = "en",
}: {
  book: ReaderBook;
  initialPage: number;
  initialBookmarks: BookmarkRow[];
  initialFavorites: FavoriteRow[];
  initialHighlights: HighlightRow[];
  lang?: Lang;
}) {
  const [page, setPage] = useState(initialPage || 1);
  const [zoom, setZoom] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [thumbsOpen, setThumbsOpen] = useState(false);
  const [bookmarks, setBookmarks] = useState(initialBookmarks);
  const [favorites, setFavorites] = useState(initialFavorites);
  const [highlights, setHighlights] = useState(initialHighlights);
  const [selectionPopup, setSelectionPopup] = useState<{
    pageNum: number;
    text: string;
    rects: HighlightRect[];
    x: number;
    y: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const thumbsAreaRef = useRef<HTMLDivElement>(null);
  const pageWrapperRefs = useRef<Array<HTMLDivElement | null>>([]);
  const canvasRefs = useRef<Array<HTMLCanvasElement | null>>([]);
  const textLayerRefs = useRef<Array<HTMLDivElement | null>>([]);
  const textLayerRenderedRef = useRef<Set<number>>(new Set());
  const selectionPopupRef = useRef<HTMLDivElement>(null);
  const thumbWrapperRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const thumbCanvasRefs = useRef<Array<HTMLCanvasElement | null>>([]);
  const renderedThumbsRef = useRef<Set<number>>(new Set());
  const pdfDocRef = useRef<PDFDocumentProxy | null>(null);
  const renderTasksRef = useRef<Map<number, RenderTask>>(new Map());
  const renderedAtZoomRef = useRef<Map<number, number>>(new Map());
  const intersectionRatiosRef = useRef<Map<number, number>>(new Map());
  const basePageSizeRef = useRef<{ width: number; height: number } | null>(null);
  const hasScrolledToInitialRef = useRef(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [numPages, setNumPages] = useState<number | null>(book.pageCount ?? null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [viewerContentWidth, setViewerContentWidth] = useState(0);
  const t = (key: string) => translate(lang, key);

  const isPdf = book.fileType === "PDF";
  const isViewable = isPdf || book.fileType === "FLIPBOOK" || book.fileType === "HTML";

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Dismiss the "Highlight" selection popup on any interaction outside it —
  // covers clicking away without starting a new text selection, which the
  // per-page text layer's onMouseUp handler alone wouldn't catch.
  useEffect(() => {
    function handleDocMouseDown(e: MouseEvent) {
      if (selectionPopupRef.current?.contains(e.target as Node)) return;
      setSelectionPopup(null);
    }
    document.addEventListener("mousedown", handleDocMouseDown);
    return () => document.removeEventListener("mousedown", handleDocMouseDown);
  }, []);

  // Track the viewer's actual content width so the placeholder height
  // reserved for off-screen pages (below) matches how tall a page canvas
  // will actually render once CSS scales it down to fit — without this,
  // narrow screens (where the canvas is scaled down a lot more than on
  // desktop) end up with a placeholder far taller than the real page,
  // leaving a big gap before the next one.
  useEffect(() => {
    const el = scrollAreaRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setViewerContentWidth(width);
    });
    observer.observe(el);
    return () => observer.disconnect();
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

  // Renders an invisible text layer over a page's canvas, once, so its text
  // becomes selectable (needed for highlighting) — the canvas already shows
  // the rendered glyphs, this just makes them selectable on top of it.
  // Position/size is driven entirely by the container's --scale-factor CSS
  // variable (set from JSX), so this never needs to re-run on zoom changes.
  const renderTextLayer = useCallback(async (pageNum: number) => {
    const doc = pdfDocRef.current;
    const container = textLayerRefs.current[pageNum - 1];
    if (!doc || !container || textLayerRenderedRef.current.has(pageNum)) return;
    textLayerRenderedRef.current.add(pageNum);

    try {
      const { TextLayer } = await import("pdfjs-dist");
      const pageProxy = await doc.getPage(pageNum);
      const viewport = pageProxy.getViewport({ scale: 1 });
      const textContent = await pageProxy.getTextContent();
      await new TextLayer({ textContentSource: textContent, container, viewport }).render();
    } catch {
      textLayerRenderedRef.current.delete(pageNum);
    }
  }, []);

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
          if (entry.isIntersecting) {
            renderPage(pageNum);
            renderTextLayer(pageNum);
          }
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
  }, [isPdf, loadState, numPages, renderPage, renderTextLayer]);

  // Renders a single low-res thumbnail (Adobe-style page navigator). Thumbs
  // are never evicted once rendered — they're small enough that keeping all
  // of them costs far less than a handful of full-resolution pages.
  const renderThumb = useCallback(async (pageNum: number) => {
    const doc = pdfDocRef.current;
    const canvas = thumbCanvasRefs.current[pageNum - 1];
    if (!doc || !canvas || renderedThumbsRef.current.has(pageNum)) return;

    const pageProxy = await doc.getPage(pageNum);
    const unscaled = pageProxy.getViewport({ scale: 1 });
    const viewport = pageProxy.getViewport({ scale: THUMB_WIDTH / unscaled.width });
    const context = canvas.getContext("2d");
    if (!context) return;

    canvas.width = viewport.width;
    canvas.height = viewport.height;
    try {
      await pageProxy.render({ canvasContext: context, viewport }).promise;
      renderedThumbsRef.current.add(pageNum);
    } catch {
      // Panel closed/unmounted mid-render — safe to ignore.
    }
  }, []);

  // Lazily render thumbnails as they scroll into view in the side panel,
  // rather than rendering all of them (which is heavy for long books) up front.
  useEffect(() => {
    if (!isPdf || !thumbsOpen || loadState !== "ready" || !numPages || !thumbsAreaRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const pageNum = Number((entry.target as HTMLElement).dataset.thumbPage);
          renderThumb(pageNum);
        });
      },
      { root: thumbsAreaRef.current, rootMargin: "400px 0px" }
    );

    thumbWrapperRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [isPdf, thumbsOpen, loadState, numPages, renderThumb]);

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

  async function removeFavorite(id: string) {
    await fetch("/api/favorites", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  }

  async function toggleFavorite(pageNumber: number) {
    const existing = favorites.find((f) => f.pageNumber === pageNumber);
    if (existing) {
      await removeFavorite(existing.id);
      return;
    }
    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId: book.id, pageNumber }),
    });
    if (res.ok) {
      const { favorite } = await res.json();
      setFavorites((prev) => [...prev, favorite]);
    }
  }

  const favoritedPages = new Set(favorites.map((f) => f.pageNumber));

  // Captures the current text selection (if any) within a page's text layer
  // as candidate highlight rects, in unscaled (scale=1) page coordinates —
  // dividing by effectiveScale here undoes whatever scale the selection was
  // made at, so the stored rects stay valid at any future zoom level.
  function handleTextSelection(pageNum: number) {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim() || !selection.rangeCount) {
      setSelectionPopup(null);
      return;
    }

    const container = textLayerRefs.current[pageNum - 1];
    const range = selection.getRangeAt(0);
    if (!container || !container.contains(range.commonAncestorContainer)) return;

    const containerRect = container.getBoundingClientRect();
    const rects = Array.from(range.getClientRects())
      .filter((r) => r.width > 0 && r.height > 0)
      .map((r) => ({
        x: (r.left - containerRect.left) / effectiveScale,
        y: (r.top - containerRect.top) / effectiveScale,
        width: r.width / effectiveScale,
        height: r.height / effectiveScale,
      }));
    if (rects.length === 0) return;

    // Clamp so the popup never gets cut off near the screen edges on narrow devices.
    const anchorRect = range.getBoundingClientRect();
    const rawX = anchorRect.left + anchorRect.width / 2;
    const x = Math.min(Math.max(rawX, 56), window.innerWidth - 56);
    setSelectionPopup({
      pageNum,
      text: selection.toString().trim(),
      rects,
      x,
      y: Math.max(anchorRect.top, 44),
    });
  }

  async function saveHighlight() {
    if (!selectionPopup) return;
    const { pageNum, text, rects } = selectionPopup;
    setSelectionPopup(null);
    window.getSelection()?.removeAllRanges();

    const res = await fetch("/api/highlights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId: book.id, pageNumber: pageNum, text, rects }),
    });
    if (res.ok) {
      const { highlight } = await res.json();
      setHighlights((prev) =>
        [...prev, { ...highlight, rects: JSON.parse(highlight.rects) }].sort((a, b) => a.pageNumber - b.pageNumber)
      );
    }
  }

  async function removeHighlight(id: string) {
    await fetch("/api/highlights", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setHighlights((prev) => prev.filter((h) => h.id !== id));
  }

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

  // The canvas itself is capped at 100% width (see className below), so on
  // screens narrower than the PDF's native render size it gets scaled down
  // by the browser. effectiveScale is the *actual* displayed scale after
  // that clamp — everything overlaid on the page (text layer, highlight
  // marks) is positioned using it so it lines up with what's drawn, and the
  // placeholder height below matches how tall the page actually renders.
  const effectiveScale = (() => {
    const base = basePageSizeRef.current;
    const nativeScale = zoom * 1.5;
    if (!base || !viewerContentWidth) return nativeScale;
    return Math.min(nativeScale, viewerContentWidth / base.width);
  })();
  const estimatedPageHeight = basePageSizeRef.current ? basePageSizeRef.current.height * effectiveScale : undefined;
  const pageDisplayWidth = basePageSizeRef.current ? basePageSizeRef.current.width * effectiveScale : 0;
  const pageDisplayHeight = basePageSizeRef.current ? basePageSizeRef.current.height * effectiveScale : 0;

  return (
    <div ref={containerRef} tabIndex={-1} className="bg-background" style={isPdf ? { userSelect: "none" } : undefined}>
      {/* Floating "Highlight" button that appears above a text selection */}
      {selectionPopup && (
        <div
          ref={selectionPopupRef}
          className="fixed z-50 -translate-x-1/2 -translate-y-full pb-2 print:hidden"
          style={{ left: selectionPopup.x, top: selectionPopup.y }}
        >
          <button
            onClick={saveHighlight}
            className="flex items-center gap-1.5 rounded-lg bg-navy px-3 py-1.5 text-xs font-medium text-white shadow-lg hover:bg-navy/90"
          >
            <Highlighter size={14} />
            {t("reader.highlightSelection")}
          </button>
        </div>
      )}

      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2.5 print:hidden sm:px-4 sm:py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Link href="/dashboard">
            <Button size="icon" variant="ghost" aria-label={t("reader.backToDashboard")}>
              <ArrowLeft size={16} />
            </Button>
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm font-medium text-navy sm:text-base">{book.title}</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <Badge variant="outline">{book.subject}</Badge>
              <Badge variant="default">{book.boardName}</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Adobe-style vertical action rail, fixed to the right edge of the viewer */}
        {isViewable && (
          <div
            className={`fixed top-1/2 z-30 flex max-h-[90vh] -translate-y-1/2 flex-col items-center gap-1 overflow-y-auto rounded-2xl border border-border bg-background/95 p-1.5 shadow-lg backdrop-blur print:hidden sm:p-2 ${
              thumbsOpen && isPdf ? "right-44" : "right-2 sm:right-4"
            }`}
          >
            <Button size="icon" variant="ghost" onClick={() => setZoom((z) => Math.min(2, z + 0.1))} aria-label={t("reader.zoomIn")}>
              <ZoomIn size={16} />
            </Button>
            <span className="data-text w-10 text-center text-[11px] text-text-secondary">{Math.round(zoom * 100)}%</span>
            <Button size="icon" variant="ghost" onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))} aria-label={t("reader.zoomOut")}>
              <ZoomOut size={16} />
            </Button>

            <div className="my-1 h-px w-6 bg-border" />

            <Button size="icon" variant="ghost" onClick={toggleFullscreen} aria-label={t("reader.toggleFullscreen")}>
              {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            </Button>

            <div className="my-1 h-px w-6 bg-border" />

            <Button
              size="icon"
              variant="ghost"
              onClick={() => toggleBookmark(page)}
              aria-label={t(bookmarkedPages.has(page) ? "reader.removeBookmark" : "reader.addBookmark")}
            >
              <Bookmark size={16} fill={bookmarkedPages.has(page) ? "currentColor" : "none"} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => toggleFavorite(page)}
              aria-label={t(favoritedPages.has(page) ? "reader.removeFavorite" : "reader.addFavorite")}
              className={favoritedPages.has(page) ? "text-brandred" : undefined}
            >
              <Heart size={16} fill={favoritedPages.has(page) ? "currentColor" : "none"} />
            </Button>
            {isPdf && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setThumbsOpen((s) => !s)}
                aria-label={t("reader.togglePageNavigator")}
                className={thumbsOpen ? "bg-background" : undefined}
              >
                <PanelRight size={16} />
              </Button>
            )}

            <div className="my-1 h-px w-6 bg-border" />

            <Button
              size="icon"
              variant="ghost"
              onClick={() => setSidebarOpen((s) => !s)}
              aria-label={`${t("reader.bookmarks")} (${bookmarks.length})`}
              className="relative"
            >
              <BookMarked size={16} />
              {bookmarks.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accentblue px-1 text-[10px] text-white">
                  {bookmarks.length}
                </span>
              )}
            </Button>
          </div>
        )}

        {/* Bookmarks sidebar: overlay drawer on mobile, inline column from md up */}
        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/40 print:hidden md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="fixed inset-y-0 left-0 z-50 w-64 flex-shrink-0 overflow-y-auto border-r border-border bg-background p-4 shadow-lg print:hidden md:static md:z-auto md:shadow-none">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-navy">{t("reader.bookmarks")}</p>
                <button onClick={() => setSidebarOpen(false)} aria-label={t("action.close")}>
                  <X size={16} className="text-text-secondary" />
                </button>
              </div>
              {bookmarks.length === 0 && <p className="text-xs text-text-secondary">{t("reader.noBookmarks")}</p>}
              <div className="space-y-2">
                {bookmarks.map((b) => (
                  <div key={b.id} className="flex items-center justify-between rounded-lg bg-background px-2 py-1.5">
                    <button onClick={() => (isPdf ? scrollToPage(b.pageNumber) : setPage(b.pageNumber))} className="data-text text-sm text-accentblue">
                      {t("reader.page")} {b.pageNumber}
                    </button>
                    <button onClick={() => removeBookmark(b.id)} aria-label={t("reader.removeBookmark")}>
                      <X size={14} className="text-text-secondary" />
                    </button>
                  </div>
                ))}
              </div>

              <p className="mb-3 mt-6 text-sm font-medium text-navy">{t("reader.highlights")}</p>
              {highlights.length === 0 && <p className="text-xs text-text-secondary">{t("reader.noHighlights")}</p>}
              <div className="space-y-2">
                {highlights.map((h) => (
                  <div key={h.id} className="flex items-start justify-between gap-2 rounded-lg bg-background px-2 py-1.5">
                    <button
                      onClick={() => (isPdf ? scrollToPage(h.pageNumber) : setPage(h.pageNumber))}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="data-text text-xs text-accentblue">
                        {t("reader.page")} {h.pageNumber}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-text-secondary">&ldquo;{h.text}&rdquo;</p>
                    </button>
                    <button onClick={() => removeHighlight(h.id)} aria-label={t("reader.removeHighlight")}>
                      <X size={14} className="text-text-secondary" />
                    </button>
                  </div>
                ))}
              </div>
            </aside>
          </>
        )}

        {/* Viewer */}
        <div ref={scrollAreaRef} className="flex-1 overflow-auto p-2 sm:p-6">
          {isPdf ? (
            <>
              {loadState === "loading" && (
                <p className="py-20 text-center text-sm text-text-secondary">{t("reader.loading")}</p>
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
                      <div className="absolute right-2 top-2 z-10 flex flex-col gap-1.5">
                        <button
                          onClick={() => toggleBookmark(pageNum)}
                          aria-label={t(bookmarkedPages.has(pageNum) ? "reader.removeBookmark" : "reader.addBookmark")}
                          className={`rounded-full p-1.5 transition-colors ${
                            bookmarkedPages.has(pageNum)
                              ? "bg-accentblue text-white"
                              : "bg-black/40 text-white/70 hover:bg-black/60 hover:text-white"
                          }`}
                        >
                          <Bookmark size={14} fill={bookmarkedPages.has(pageNum) ? "currentColor" : "none"} />
                        </button>
                        <button
                          onClick={() => toggleFavorite(pageNum)}
                          aria-label={t(favoritedPages.has(pageNum) ? "reader.removeFavorite" : "reader.addFavorite")}
                          className={`rounded-full p-1.5 transition-colors ${
                            favoritedPages.has(pageNum) ? "bg-brandred text-white" : "bg-black/40 text-white/70 hover:bg-black/60 hover:text-white"
                          }`}
                        >
                          <Heart size={14} fill={favoritedPages.has(pageNum) ? "currentColor" : "none"} />
                        </button>
                      </div>
                      <canvas
                        ref={(el) => {
                          canvasRefs.current[pageNum - 1] = el;
                        }}
                        className="mx-auto block h-auto max-w-full rounded-lg border border-border"
                        onDragStart={(e) => e.preventDefault()}
                      />
                      {/* Saved highlight marks — purely visual, positioned to match
                          the canvas exactly; managed from the Bookmarks panel. */}
                      <div
                        className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2"
                        style={{ width: pageDisplayWidth, height: pageDisplayHeight }}
                      >
                        {highlights
                          .filter((h) => h.pageNumber === pageNum)
                          .flatMap((h) =>
                            h.rects.map((r, i) => (
                              <div
                                key={`${h.id}-${i}`}
                                className="absolute rounded-sm bg-yellow-300/40"
                                style={{
                                  left: r.x * effectiveScale,
                                  top: r.y * effectiveScale,
                                  width: r.width * effectiveScale,
                                  height: r.height * effectiveScale,
                                }}
                              />
                            ))
                          )}
                      </div>
                      {/* Invisible text layer over the canvas — makes the rendered
                          text selectable so it can be highlighted. */}
                      <div
                        ref={(el) => {
                          textLayerRefs.current[pageNum - 1] = el;
                        }}
                        className="textLayer absolute left-1/2 top-0 -translate-x-1/2 select-text"
                        style={{ ["--scale-factor" as string]: effectiveScale }}
                        onMouseUp={() => handleTextSelection(pageNum)}
                      />
                    </div>
                  ))}
                </div>
              )}
              <p className="hidden py-20 text-center text-sm print:block">{t("reader.printDisabled")}</p>
            </>
          ) : isViewable ? (
            <div
              className="mx-auto w-full max-w-[800px] origin-top transition-transform"
              style={{ transform: `scale(${zoom})` }}
            >
              <iframe
                key={page}
                src={`${book.drivePreviewUrl}#page=${page}`}
                className="h-[min(1100px,80vh)] w-full rounded-lg border border-border"
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

        {/* Page navigator: Adobe-style thumbnail strip, click a page to jump to it */}
        {isPdf && thumbsOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/40 print:hidden lg:hidden"
              onClick={() => setThumbsOpen(false)}
            />
            <aside
              ref={thumbsAreaRef}
              className="fixed inset-y-0 right-0 z-50 w-40 flex-shrink-0 overflow-y-auto border-l border-border bg-background p-3 shadow-lg print:hidden lg:static lg:z-auto lg:shadow-none"
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-navy">{t("reader.pageNavigator")}</p>
                <button onClick={() => setThumbsOpen(false)} aria-label={t("action.close")}>
                  <X size={16} className="text-text-secondary" />
                </button>
              </div>
              <div className="space-y-2">
                {numPages &&
                  Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      ref={(el) => {
                        thumbWrapperRefs.current[pageNum - 1] = el;
                      }}
                      data-thumb-page={pageNum}
                      onClick={() => (isPdf ? scrollToPage(pageNum) : setPage(pageNum))}
                      className={`block w-full rounded-lg border-2 p-1 transition-colors ${
                        page === pageNum ? "border-accentblue" : "border-transparent hover:border-border"
                      }`}
                    >
                      <canvas
                        ref={(el) => {
                          thumbCanvasRefs.current[pageNum - 1] = el;
                        }}
                        className="mx-auto block h-auto max-w-full rounded border border-border"
                      />
                      <p className="mt-1 text-center text-xs text-text-secondary">{pageNum}</p>
                    </button>
                  ))}
              </div>
            </aside>
          </>
        )}
      </div>

      {/* Bottom bar: page navigation */}
      {isViewable && (
        <div className="flex items-center justify-center gap-2 border-t border-border px-3 py-2.5 print:hidden sm:gap-4 sm:px-4 sm:py-3">
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
              className="w-12 rounded border border-border bg-card px-2 py-1 text-center sm:w-14"
            />
            <span className="text-text-secondary">/ {numPages ?? "—"}</span>
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
