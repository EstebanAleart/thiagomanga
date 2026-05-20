"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, BookOpen, Tv, Download, Check } from "lucide-react";
import { decodeFavorites } from "@/lib/share";

function SharedContent() {
  const searchParams = useSearchParams();
  const encoded = searchParams.get("data");
  const [imported, setImported] = useState(false);
  const [tab, setTab] = useState<"manga" | "anime">("manga");

  if (!encoded) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground text-lg mb-4">No se encontraron datos para mostrar</p>
        <Button asChild><Link href="/">Ir al inicio</Link></Button>
      </div>
    );
  }

  const data = decodeFavorites(encoded);

  const importToFavorites = () => {
    if (data.manga.length > 0) {
      const existing = JSON.parse(localStorage.getItem("manga-favorites") || "[]");
      const existingIds = new Set(existing.map((f: { id: string }) => f.id));
      const newItems = data.manga.filter((m) => !existingIds.has(m.id));
      localStorage.setItem("manga-favorites", JSON.stringify([...existing, ...newItems]));
    }
    if (data.anime.length > 0) {
      const existing = JSON.parse(localStorage.getItem("anime-favorites") || "[]");
      const existingIds = new Set(existing.map((f: { id: number }) => f.id));
      const newItems = data.anime.filter((a) => !existingIds.has(a.id));
      localStorage.setItem("anime-favorites", JSON.stringify([...existing, ...newItems]));
    }
    setImported(true);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Heart className="h-8 w-8 text-primary" />
          Favoritos compartidos
        </h1>
        <Button
          onClick={importToFavorites}
          disabled={imported}
          className="flex items-center gap-2"
        >
          {imported ? <Check className="h-4 w-4" /> : <Download className="h-4 w-4" />}
          {imported ? "Importado" : "Importar a mis favoritos"}
        </Button>
      </div>

      <div className="flex gap-2 mb-8">
        <Button
          variant={tab === "manga" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("manga")}
          className="flex items-center gap-2"
        >
          <BookOpen className="h-4 w-4" />
          Manga ({data.manga.length})
        </Button>
        <Button
          variant={tab === "anime" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("anime")}
          className="flex items-center gap-2"
        >
          <Tv className="h-4 w-4" />
          Anime ({data.anime.length})
        </Button>
      </div>

      {tab === "manga" && (
        data.manga.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">No hay mangas en esta lista</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {data.manga.map((manga) => (
              <Link key={manga.id} href={`/manga/${manga.id}`} className="group">
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
            ))}
          </div>
        )
      )}

      {tab === "anime" && (
        data.anime.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">No hay animes en esta lista</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {data.anime.map((anime) => (
              <Link key={anime.id} href={`/anime/${anime.id}`} className="group">
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
            ))}
          </div>
        )
      )}
    </>
  );
}

export default function SharedPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <Suspense fallback={
          <div className="text-center py-20">
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        }>
          <SharedContent />
        </Suspense>
      </main>
    </div>
  );
}
