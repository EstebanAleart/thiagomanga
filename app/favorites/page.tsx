"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { Heart, Trash2, BookOpen, Tv, Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getShareUrl } from "@/lib/share";

interface FavoriteManga {
  id: string;
  title: string;
  coverUrl: string;
  status: string;
  year: number | null;
}

interface FavoriteAnime {
  id: number;
  title: string;
  coverUrl: string;
  status: string | null;
  episodes: number | null;
  score: number | null;
}

type Tab = "manga" | "anime";

export default function FavoritesPage() {
  const [tab, setTab] = useState<Tab>("manga");
  const [mangaFavs, setMangaFavs] = useState<FavoriteManga[]>([]);
  const [animeFavs, setAnimeFavs] = useState<FavoriteAnime[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMangaFavs(JSON.parse(localStorage.getItem("manga-favorites") || "[]"));
    setAnimeFavs(JSON.parse(localStorage.getItem("anime-favorites") || "[]"));
  }, []);

  const removeManga = (id: string) => {
    const updated = mangaFavs.filter((f) => f.id !== id);
    setMangaFavs(updated);
    localStorage.setItem("manga-favorites", JSON.stringify(updated));
  };

  const removeAnime = (id: number) => {
    const updated = animeFavs.filter((f) => f.id !== id);
    setAnimeFavs(updated);
    localStorage.setItem("anime-favorites", JSON.stringify(updated));
  };

  const totalCount = mangaFavs.length + animeFavs.length;

  const handleShare = () => {
    const url = getShareUrl();
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Heart className="h-8 w-8 text-primary fill-primary" />
            Mis Favoritos
          </h1>
          {totalCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="flex items-center gap-2"
            >
              {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
              {copied ? "Link copiado" : "Compartir"}
            </Button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          <Button
            variant={tab === "manga" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("manga")}
            className="flex items-center gap-2"
          >
            <BookOpen className="h-4 w-4" />
            Manga ({mangaFavs.length})
          </Button>
          <Button
            variant={tab === "anime" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("anime")}
            className="flex items-center gap-2"
          >
            <Tv className="h-4 w-4" />
            Anime ({animeFavs.length})
          </Button>
        </div>

        {/* Manga tab */}
        {tab === "manga" && (
          <>
            {mangaFavs.length === 0 ? (
              <div className="text-center py-20">
                <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg mb-2">No ten\u00e9s mangas favoritos</p>
                <p className="text-muted-foreground text-sm mb-6">Explor\u00e1 mangas y agreg\u00e1 tus favoritos</p>
                <Button asChild><Link href="/">Explorar mangas</Link></Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {mangaFavs.map((manga) => (
                  <div key={manga.id} className="relative group">
                    <Link href={`/manga/${manga.id}`}>
                      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted mb-2">
                        {manga.coverUrl ? (
                          <img
                            src={`/api/proxy-image?url=${encodeURIComponent(manga.coverUrl)}`}
                            alt={manga.title}
                            className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <BookOpen className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <h3 className="font-medium text-sm line-clamp-2 text-foreground mb-1">{manga.title}</h3>
                      {manga.status && (
                        <Badge variant="secondary" className="text-xs">
                          {manga.status === "ongoing" ? "En curso" : manga.status === "completed" ? "Completado" : manga.status}
                        </Badge>
                      )}
                    </Link>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeManga(manga.id)}
                      title="Quitar de favoritos"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Anime tab */}
        {tab === "anime" && (
          <>
            {animeFavs.length === 0 ? (
              <div className="text-center py-20">
                <Tv className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg mb-2">No ten\u00e9s animes favoritos</p>
                <p className="text-muted-foreground text-sm mb-6">Explor\u00e1 anime y agreg\u00e1 tus favoritos</p>
                <Button asChild><Link href="/anime">Explorar anime</Link></Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {animeFavs.map((anime) => (
                  <div key={anime.id} className="relative group">
                    <Link href={`/anime/${anime.id}`}>
                      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted mb-2">
                        {anime.coverUrl ? (
                          <img
                            src={anime.coverUrl}
                            alt={anime.title}
                            className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Tv className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <h3 className="font-medium text-sm line-clamp-2 text-foreground mb-1">{anime.title}</h3>
                      <div className="flex items-center gap-1">
                        {anime.episodes && (
                          <Badge variant="secondary" className="text-xs">{anime.episodes} eps</Badge>
                        )}
                        {anime.score && (
                          <Badge variant="outline" className="text-xs">{(anime.score / 10).toFixed(1)}</Badge>
                        )}
                      </div>
                    </Link>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeAnime(anime.id)}
                      title="Quitar de favoritos"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
