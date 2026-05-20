"use client";

import Link from "next/link";
import { BookOpen, Home, Heart, Newspaper, Library, Tv } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export function Header() {
  const [favCount, setFavCount] = useState(0);

  useEffect(() => {
    const update = () => {
      const mangaFavs = JSON.parse(localStorage.getItem("manga-favorites") || "[]");
      const animeFavs = JSON.parse(localStorage.getItem("anime-favorites") || "[]");
      setFavCount(mangaFavs.length + animeFavs.length);
    };
    update();
    window.addEventListener("storage", update);
    const interval = setInterval(update, 1000);
    return () => { window.removeEventListener("storage", update); clearInterval(interval); };
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="rounded-lg bg-primary p-2">
            <BookOpen className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl text-foreground">MangaThiago</span>
        </Link>
        <nav className="flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Inicio</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/anime" className="flex items-center gap-2">
              <Tv className="h-4 w-4" />
              <span className="hidden sm:inline">Anime</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/news" className="flex items-center gap-2">
              <Newspaper className="h-4 w-4" />
              <span className="hidden sm:inline">Enciclopedia</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/comick" className="flex items-center gap-2">
              <Library className="h-4 w-4" />
              <span className="hidden sm:inline">ComicK</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/favorites" className="flex items-center gap-2 relative">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Favoritos</span>
              {favCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold">
                  {favCount > 9 ? "9+" : favCount}
                </span>
              )}
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
