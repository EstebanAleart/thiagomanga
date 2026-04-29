"use client";

import { use, useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import {
  ChevronLeft, ChevronRight, Home, Maximize2, Minimize2,
  List, X, AlignJustify, BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { ComickChapter } from "@/lib/comick";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type ReadingMode = "page" | "scroll";

interface Props { params: Promise<{ hid: string }> }

export default function ComickReaderPage({ params }: Props) {
  const { hid } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug") ?? "";
  const lang = searchParams.get("lang") ?? "en";

  const [currentPage, setCurrentPage] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [mode, setMode] = useState<ReadingMode>("page");
  const [showChapterList, setShowChapterList] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const [scrollPage, setScrollPage] = useState(0);
  const pageRefs = useRef<(HTMLImageElement | null)[]>([]);

  // Restore reading mode preference
  useEffect(() => {
    const saved = localStorage.getItem("reading-mode") as ReadingMode | null;
    if (saved) setMode(saved);
  }, []);

  const switchMode = (m: ReadingMode) => {
    setMode(m);
    localStorage.setItem("reading-mode", m);
  };

  // Auto-hide navigation
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const show = () => {
      setNavVisible(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setNavVisible(false), 3000);
    };
    window.addEventListener("mousemove", show);
    window.addEventListener("touchstart", show);
    show();
    return () => {
      window.removeEventListener("mousemove", show);
      window.removeEventListener("touchstart", show);
      clearTimeout(timeout);
    };
  }, []);

  // IntersectionObserver for scroll mode
  useEffect(() => {
    if (mode !== "scroll") return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = pageRefs.current.indexOf(entry.target as HTMLImageElement);
            if (idx !== -1) setScrollPage(idx);
          }
        });
      },
      { threshold: 0.4 }
    );
    pageRefs.current.forEach((el) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [mode, pageRefs.current.length]);

  const { data: chapterRaw, isLoading, error } = useSWR<{ chapter: { images: { url: string }[] } }>(
    `https://api.comick.io/chapter/${hid}`,
    fetcher
  );
  const data = chapterRaw
    ? { pages: chapterRaw.chapter?.images?.map((i) => i.url) ?? [], total: chapterRaw.chapter?.images?.length ?? 0 }
    : undefined;

  const { data: chaptersData } = useSWR<{ chapters: ComickChapter[]; total: number }>(
    slug ? `https://api.comick.io/comic/${slug}/chapters?lang=${lang}&limit=300` : null,
    fetcher
  );

  const chapters = chaptersData?.chapters ?? [];
  const currentChapterIdx = chapters.findIndex((c) => c.hid === hid);
  const prevChapter = currentChapterIdx > 0 ? chapters[currentChapterIdx - 1] : null;
  const nextChapter = currentChapterIdx < chapters.length - 1 ? chapters[currentChapterIdx + 1] : null;
  const currentChapter = chapters[currentChapterIdx];

  const goToPage = useCallback((page: number) => {
    setImageLoading(true);
    setImageError(false);
    setCurrentPage(page);
  }, []);

  const goToPrev = useCallback(() => {
    if (currentPage > 0) goToPage(currentPage - 1);
    else if (prevChapter) router.push(`/comick/read/${prevChapter.hid}?slug=${slug}&lang=${lang}`);
  }, [currentPage, prevChapter, slug, lang, router, goToPage]);

  const goToNext = useCallback(() => {
    if (data && currentPage < data.pages.length - 1) goToPage(currentPage + 1);
    else if (nextChapter) router.push(`/comick/read/${nextChapter.hid}?slug=${slug}&lang=${lang}`);
  }, [currentPage, data, nextChapter, slug, lang, router, goToPage]);

  useEffect(() => {
    if (mode !== "page") return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goToPrev();
      else if (e.key === "ArrowRight") goToNext();
      else if (e.key === "Escape") { setIsFullscreen(false); setShowChapterList(false); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToPrev, goToNext, mode]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const displayPage = mode === "scroll" ? scrollPage : currentPage;
  const totalPages = data?.pages.length ?? 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-3">
        <Spinner className="w-8 h-8 text-white" />
        <p className="text-white/50 text-sm">Cargando páginas...</p>
      </div>
    );
  }

  if (error || !data?.pages || data.pages.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">No se pudieron cargar las páginas</p>
        <Button asChild>
          <Link href={slug ? `/comick/manga/${slug}` : "/comick"}>Volver</Link>
        </Button>
      </div>
    );
  }

  const pages = data.pages;
  const backUrl = slug ? `/comick/manga/${slug}` : "/comick";

  return (
    <div className="min-h-screen bg-black text-white select-none">

      {/* Top nav */}
      <div className={`fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b border-white/10 transition-opacity duration-300 ${navVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        <div className="container flex items-center justify-between h-14 gap-2">
          <Button variant="ghost" size="sm" asChild className="text-white hover:bg-white/10 shrink-0">
            <Link href={backUrl} className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">← Volver</span>
            </Link>
          </Button>

          <div className="flex flex-col items-center min-w-0">
            {currentChapter && (
              <span className="text-xs text-white/50 truncate max-w-[200px]">
                Cap. {currentChapter.chap ?? "?"}{currentChapter.title ? ` – ${currentChapter.title}` : ""}
              </span>
            )}
            <span className="text-sm font-medium text-white/80">
              Página {displayPage + 1} / {totalPages}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Mode toggle */}
            <div className="flex items-center bg-white/10 rounded-md p-0.5 mr-1">
              <button
                onClick={() => switchMode("page")}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${mode === "page" ? "bg-white text-black font-semibold" : "text-white/60 hover:text-white"}`}
                title="Modo página"
              >
                <BookOpen className="h-3 w-3" />
                <span className="hidden sm:inline">Página</span>
              </button>
              <button
                onClick={() => switchMode("scroll")}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${mode === "scroll" ? "bg-white text-black font-semibold" : "text-white/60 hover:text-white"}`}
                title="Modo scroll"
              >
                <AlignJustify className="h-3 w-3" />
                <span className="hidden sm:inline">Scroll</span>
              </button>
            </div>

            {slug && (
              <Button variant="ghost" size="sm" onClick={() => setShowChapterList(!showChapterList)} className="text-white hover:bg-white/10" title="Capítulos">
                <List className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={toggleFullscreen} className="text-white hover:bg-white/10">
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Chapter list panel */}
      {showChapterList && (
        <div className="fixed top-14 right-0 bottom-0 z-40 w-72 bg-black/95 border-l border-white/10 overflow-y-auto">
          <div className="flex items-center justify-between p-3 border-b border-white/10">
            <span className="font-medium text-sm">Capítulos</span>
            <Button variant="ghost" size="sm" onClick={() => setShowChapterList(false)} className="text-white hover:bg-white/10 h-7 w-7 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-2 flex flex-col gap-1">
            {chapters.map((ch) => (
              <Link
                key={ch.hid}
                href={`/comick/read/${ch.hid}?slug=${slug}&lang=${lang}`}
                onClick={() => setShowChapterList(false)}
                className={`px-3 py-2 rounded text-sm transition-colors ${ch.hid === hid ? "bg-primary text-primary-foreground" : "text-white/70 hover:bg-white/10"}`}
              >
                Cap. {ch.chap ?? "?"}{ch.title ? ` – ${ch.title}` : ""}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── SCROLL MODE ── */}
      {mode === "scroll" && (
        <div className="pt-14">
          <div className="flex flex-col items-center">
            {pages.map((pageUrl, idx) => (
              <img
                key={`${hid}-${idx}`}
                ref={(el) => { pageRefs.current[idx] = el; }}
                src={`/api/proxy-image?url=${encodeURIComponent(pageUrl)}`}
                alt={`Página ${idx + 1}`}
                className="w-full max-w-3xl"
                loading={idx < 3 ? "eager" : "lazy"}
              />
            ))}
          </div>

          <div className="flex flex-col items-center gap-4 py-16 px-4">
            {nextChapter ? (
              <>
                <p className="text-white/50 text-sm">Fin del capítulo</p>
                <Button onClick={() => router.push(`/comick/read/${nextChapter.hid}?slug=${slug}&lang=${lang}`)}>
                  Siguiente capítulo → Cap. {nextChapter.chap ?? "?"}
                </Button>
              </>
            ) : (
              <p className="text-white/50 text-sm">No hay más capítulos disponibles</p>
            )}
            <Button variant="ghost" asChild className="text-white/50 hover:text-white">
              <Link href={backUrl}>Volver al manga</Link>
            </Button>
          </div>
        </div>
      )}

      {/* ── PAGE MODE ── */}
      {mode === "page" && (
        <>
          <div className="pt-14 pb-20 min-h-screen flex items-center justify-center">
            <div className="relative w-full max-w-3xl mx-auto px-2">
              <div className="relative bg-gray-900 flex items-center justify-center min-h-[60vh]">
                {imageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <Spinner className="w-8 h-8 text-white" />
                  </div>
                )}
                {imageError ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <p className="text-white/50">Error al cargar la imagen</p>
                    <Button size="sm" variant="outline" onClick={() => { setImageError(false); setImageLoading(true); }}>
                      Reintentar
                    </Button>
                  </div>
                ) : (
                  <img
                    key={`${hid}-${currentPage}`}
                    src={`/api/proxy-image?url=${encodeURIComponent(pages[currentPage])}`}
                    alt={`Página ${currentPage + 1}`}
                    className={`w-full h-auto object-contain transition-opacity duration-200 ${imageLoading ? "opacity-0" : "opacity-100"}`}
                    onLoad={() => { setImageLoading(false); setImageError(false); }}
                    onError={() => { setImageLoading(false); setImageError(true); }}
                  />
                )}
                <button onClick={goToPrev} className="absolute left-0 top-0 bottom-0 w-1/3 cursor-w-resize focus:outline-none" aria-label="Página anterior" />
                <button onClick={goToNext} className="absolute right-0 top-0 bottom-0 w-1/3 cursor-e-resize focus:outline-none" aria-label="Página siguiente" />
              </div>
            </div>
          </div>

          {/* Bottom nav */}
          <div className={`fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-t border-white/10 transition-opacity duration-300 ${navVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
            <div className="container flex items-center gap-3 h-16">
              <Button
                variant="ghost" size="sm"
                onClick={() => prevChapter && router.push(`/comick/read/${prevChapter.hid}?slug=${slug}&lang=${lang}`)}
                disabled={!prevChapter}
                className="text-white hover:bg-white/10 disabled:opacity-20 shrink-0 text-xs px-2"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Cap. anterior</span>
              </Button>

              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Button variant="ghost" size="icon" onClick={() => goToPage(Math.max(0, currentPage - 1))} disabled={currentPage === 0} className="text-white hover:bg-white/10 disabled:opacity-30 shrink-0 h-8 w-8">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1 flex flex-col gap-1 min-w-0">
                  <input type="range" min={0} max={totalPages - 1} value={currentPage} onChange={(e) => goToPage(parseInt(e.target.value))} className="w-full accent-primary cursor-pointer" />
                  <div className="flex justify-between text-[10px] text-white/40">
                    <span>1</span>
                    <span>{totalPages}</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => goToPage(Math.min(totalPages - 1, currentPage + 1))} disabled={currentPage === totalPages - 1} className="text-white hover:bg-white/10 disabled:opacity-30 shrink-0 h-8 w-8">
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              <Button
                variant="ghost" size="sm"
                onClick={() => nextChapter && router.push(`/comick/read/${nextChapter.hid}?slug=${slug}&lang=${lang}`)}
                disabled={!nextChapter}
                className="text-white hover:bg-white/10 disabled:opacity-20 shrink-0 text-xs px-2"
              >
                <span className="hidden sm:inline">Cap. siguiente</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
