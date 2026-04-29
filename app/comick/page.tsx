"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Search, BookOpen, Star, Loader2 } from "lucide-react";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { ComickManga } from "@/lib/comick";
import { COMICK_STATUS, comickCover } from "@/lib/comick";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ComickPage() {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("one piece");
  const [page, setPage] = useState(1);

  const { data: results, isLoading } = useSWR<ComickManga[]>(
    `https://api.comick.io/v1.0/search/?q=${encodeURIComponent(submitted)}&limit=24&page=${page}`,
    fetcher
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(query);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">ComicK</h1>
          <p className="text-muted-foreground text-sm">Catálogo enorme de manga en múltiples idiomas.</p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 mb-8 max-w-xl">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar manga..."
            className="flex-1"
          />
          <Button type="submit">
            <Search className="h-4 w-4 mr-2" />
            Buscar
          </Button>
        </form>

        {isLoading && (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && results && results.length === 0 && (
          <p className="text-center text-muted-foreground py-16">Sin resultados para "{submitted}"</p>
        )}

        {!isLoading && results && results.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {results.map((manga) => (
              <Link
                key={manga.id}
                href={`/comick/manga/${manga.slug}`}
                className="group flex flex-col gap-2"
              >
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted">
                  {manga.cover_url ? (
                    <img
                      src={`/api/proxy-image?url=${encodeURIComponent(comickCover(manga.cover_url))}`}
                      alt={manga.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                  )}
                  {manga.status && (
                    <Badge className="absolute top-1 left-1 text-[10px] px-1 py-0 bg-black/70 text-white border-0">
                      {COMICK_STATUS[manga.status] || ""}
                    </Badge>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {manga.title}
                  </p>
                  {manga.rating && (
                    <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 mt-0.5">
                      <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                      {parseFloat(manga.rating).toFixed(1)}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {results && results.length > 0 && (
          <div className="flex justify-center gap-3 mt-10">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 1 || isLoading}>
              ← Anterior
            </Button>
            <span className="text-sm text-muted-foreground self-center">Página {page}</span>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={isLoading || (results?.length ?? 0) < 24}>
              Siguiente →
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
