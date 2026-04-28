"use client";

import { use, useState, useEffect, useRef } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Home, AlignJustify, BookOpen, ChevronLeft, ChevronRight, X, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { DanbooruPost, DanbooruPool } from "@/lib/danbooru";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type ReadingMode = "scroll" | "page";

interface Props {
  params: Promise<{ id: string }>;
}

export default function PoolReaderPage({ params }: Props) {
  const { id } = use(params);
  const [mode, setMode] = useState<ReadingMode>("scroll");
  const [currentPage, setCurrentPage] = useState(0);
  const [navVisible, setNavVisible] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const scrollPageRefs = useRef<(HTMLImageElement | null)[]>([]);
  const [scrollPage, setScrollPage] = useState(0);

  // Restore mode preference
  useEffect(() => {
    const saved = localStorage.getItem("reading-mode") as ReadingMode | null;
    if (saved) setMode(saved);
  }, []);

  const switchMode = (m: ReadingMode) => {
    setMode(m);
    localStorage.setItem("reading-mode", m);
    setShowSettings(false);
  };

  // Auto-hide nav
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

  // IntersectionObserver for scroll mode page tracking
  useEffect(() => {
    if (mode !== "scroll") return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const idx = scrollPageRefs.current.indexOf(e.target as HTMLImageElement);
            if (idx !== -1) setScrollPage(idx);
          }
        });
      },
      { threshold: 0.4 }
    );
    scrollPageRefs.current.forEach((el) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [mode, scrollPageRefs.current.length]);

  const { data, isLoading, error } = useSWR<{ pool: DanbooruPool; posts: DanbooruPost[] }>(
    `/api/danbooru/pool/${id}`,
    fetcher
  );

  const displayPage = mode === "scroll" ? scrollPage : currentPage;
  const totalPages = data?.posts.length ?? 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-3">
        <Spinner className="w-8 h-8 text-white" />
        <p className="text-white/50 text-sm">Cargando colección...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">No se pudo cargar la colección</p>
        <Button asChild><Link href="/danbooru">Volver</Link></Button>
      </div>
    );
  }

  const { pool, posts } = data;

  return (
    <div className="min-h-screen bg-black text-white select-none">

      {/* Top nav */}
      <div className={`fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b border-white/10 transition-opacity duration-300 ${navVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        <div className="container flex items-center justify-between h-14 gap-2">
          <Button variant="ghost" size="sm" asChild className="text-white hover:bg-white/10 shrink-0">
            <Link href="/danbooru" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">← Danbooru</span>
            </Link>
          </Button>

          <div className="flex flex-col items-center min-w-0 flex-1">
            <span className="text-xs text-white/50 truncate max-w-[240px]">
              {pool.name.replace(/_/g, " ")}
            </span>
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
              >
                <BookOpen className="h-3 w-3" />
                <span className="hidden sm:inline">Página</span>
              </button>
              <button
                onClick={() => switchMode("scroll")}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${mode === "scroll" ? "bg-white text-black font-semibold" : "text-white/60 hover:text-white"}`}
              >
                <AlignJustify className="h-3 w-3" />
                <span className="hidden sm:inline">Scroll</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── SCROLL MODE ── */}
      {mode === "scroll" && (
        <div className="pt-14">
          <div className="flex flex-col items-center">
            {posts.map((post, idx) => (
              <img
                key={post.id}
                ref={(el) => { scrollPageRefs.current[idx] = el; }}
                src={post.large_file_url || post.file_url}
                alt={`Página ${idx + 1}`}
                className="w-full max-w-3xl"
                loading={idx < 3 ? "eager" : "lazy"}
              />
            ))}
          </div>

          <div className="flex flex-col items-center gap-4 py-16 px-4">
            <p className="text-white/50 text-sm">Fin de la colección</p>
            <Button asChild variant="outline">
              <Link href="/danbooru">Volver a Danbooru</Link>
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
                <img
                  key={`${id}-${currentPage}`}
                  src={`/api/proxy-image?url=${encodeURIComponent(posts[currentPage]?.large_file_url || posts[currentPage]?.file_url || "")}`}
                  alt={`Página ${currentPage + 1}`}
                  className="w-full h-auto object-contain"
                />
                <button onClick={() => setCurrentPage((p) => Math.max(0, p - 1))} className="absolute left-0 top-0 bottom-0 w-1/3 cursor-w-resize focus:outline-none" aria-label="Anterior" />
                <button onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))} className="absolute right-0 top-0 bottom-0 w-1/3 cursor-e-resize focus:outline-none" aria-label="Siguiente" />
              </div>
            </div>
          </div>

          {/* Bottom nav */}
          <div className={`fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-t border-white/10 transition-opacity duration-300 ${navVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
            <div className="container flex items-center gap-3 h-16">
              <Button variant="ghost" size="icon" onClick={() => setCurrentPage((p) => Math.max(0, p - 1))} disabled={currentPage === 0} className="text-white hover:bg-white/10 disabled:opacity-30 h-8 w-8 shrink-0">
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1 flex flex-col gap-1 min-w-0">
                <input type="range" min={0} max={totalPages - 1} value={currentPage} onChange={(e) => setCurrentPage(parseInt(e.target.value))} className="w-full accent-primary cursor-pointer" />
                <div className="flex justify-between text-[10px] text-white/40">
                  <span>1</span>
                  <span>{totalPages}</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))} disabled={currentPage === totalPages - 1} className="text-white hover:bg-white/10 disabled:opacity-30 h-8 w-8 shrink-0">
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
