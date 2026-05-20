"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Search, Play, Subtitles, Mic, Flame, TrendingUp, Clock, X } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface StreamResult {
  id: string;
  title: string;
  image: string | null;
  type: string | null;
  releaseDate: string | null;
  hasSub: boolean | null;
  hasDub: boolean | null;
}

type Category = "airing" | "popular" | "recent";

const CATEGORIES: { key: Category; label: string; icon: typeof Flame }[] = [
  { key: "airing", label: "En emisión", icon: Flame },
  { key: "popular", label: "Populares", icon: TrendingUp },
  { key: "recent", label: "Recientes", icon: Clock },
];

export default function WatchPage() {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("airing");

  // Search results
  const { data: searchData, isLoading: searchLoading } = useSWR<{ results: StreamResult[]; hasNextPage: boolean }>(
    search ? `/api/streaming/search?q=${encodeURIComponent(search)}` : null,
    fetcher
  );

  // Default browse (when not searching)
  const { data: browseData, isLoading: browseLoading } = useSWR<{ results: StreamResult[]; hasNextPage: boolean }>(
    !search ? `/api/streaming/search?cat=${category}` : null,
    fetcher
  );

  const data = search ? searchData : browseData;
  const isLoading = search ? searchLoading : browseLoading;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) setSearch(query.trim());
  };

  const clearSearch = () => {
    setQuery("");
    setSearch("");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <h1 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
          <Play className="h-8 w-8 text-primary" />
          Ver Anime
        </h1>

        <form onSubmit={handleSearch} className="flex gap-2 mb-6 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar anime para ver..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <Button type="submit">Buscar</Button>
          {search && (
            <Button type="button" variant="ghost" size="icon" onClick={clearSearch} title="Limpiar búsqueda">
              <X className="h-4 w-4" />
            </Button>
          )}
        </form>

        {/* Category tabs (only when not searching) */}
        {!search && (
          <div className="flex gap-2 mb-6">
            {CATEGORIES.map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                variant={category === key ? "default" : "outline"}
                size="sm"
                onClick={() => setCategory(key)}
                className="flex items-center gap-2"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Button>
            ))}
          </div>
        )}

        {/* Search active indicator */}
        {search && (
          <p className="text-sm text-muted-foreground mb-4">
            Resultados para <strong className="text-foreground">&quot;{search}&quot;</strong>
          </p>
        )}

        {isLoading && (
          <div className="flex justify-center py-12">
            <Spinner className="w-8 h-8 text-primary" />
          </div>
        )}

        {data && !isLoading && (
          <>
            {data.results.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">
                No se encontraron resultados
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {data.results.map((anime) => (
                  <Link
                    key={anime.id}
                    href={`/watch/${encodeURIComponent(anime.id)}`}
                    className="group"
                  >
                    <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted mb-2">
                      {anime.image ? (
                        <img
                          src={anime.image}
                          alt={anime.title}
                          className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Play className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <Play className="h-10 w-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <h3 className="font-medium text-sm line-clamp-2 text-foreground mb-1">{anime.title}</h3>
                    <div className="flex items-center gap-1 flex-wrap">
                      {anime.type && (
                        <Badge variant="secondary" className="text-xs">{anime.type}</Badge>
                      )}
                      {anime.hasSub && (
                        <Badge variant="outline" className="text-xs flex items-center gap-0.5">
                          <Subtitles className="h-3 w-3" /> SUB
                        </Badge>
                      )}
                      {anime.hasDub && (
                        <Badge variant="outline" className="text-xs flex items-center gap-0.5">
                          <Mic className="h-3 w-3" /> DUB
                        </Badge>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
