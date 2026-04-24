"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { Heart, Trash2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface FavoriteManga {
  id: string;
  title: string;
  coverUrl: string;
  status: string;
  year: number | null;
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteManga[]>([]);

  useEffect(() => {
    const favs = JSON.parse(localStorage.getItem("manga-favorites") || "[]");
    setFavorites(favs);
  }, []);

  const removeFavorite = (id: string) => {
    const updated = favorites.filter((f) => f.id !== id);
    setFavorites(updated);
    localStorage.setItem("manga-favorites", JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8 flex items-center gap-3">
          <Heart className="h-8 w-8 text-primary fill-primary" />
          Mis Favoritos
        </h1>

        {favorites.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg mb-2">
              Aún no tenés favoritos
            </p>
            <p className="text-muted-foreground text-sm mb-6">
              Explorá mangas y agregá tus favoritos para verlos acá
            </p>
            <Button asChild>
              <Link href="/">Explorar mangas</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {favorites.map((manga) => (
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
                  onClick={() => removeFavorite(manga.id)}
                  title="Quitar de favoritos"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
