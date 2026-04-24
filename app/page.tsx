"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Header } from "@/components/header";
import { SearchBar } from "@/components/search-bar";
import { MangaGrid } from "@/components/manga-grid";
import { MangaFilters } from "@/components/manga-filters";
import { Button } from "@/components/ui/button";
import type { MangaSearchResult, SearchFilters } from "@/lib/mangadex";

const fetcher = (url: string) => fetch(url).then((res) => res.json());
const PAGE_SIZE = 20;

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({});
  const [page, setPage] = useState(0);

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (filters.demographic) params.set("demographic", filters.demographic);
    if (filters.status) params.set("status", filters.status);
    if (filters.orderBy) params.set("orderBy", filters.orderBy);
    if (filters.tags && filters.tags.length > 0) {
      filters.tags.forEach(tag => params.append("tags", tag));
    }
    params.set("limit", PAGE_SIZE.toString());
    params.set("offset", (page * PAGE_SIZE).toString());
    return `/api/manga/search?${params.toString()}`;
  }, [searchQuery, filters, page]);

  const { data, isLoading } = useSWR<{ data: MangaSearchResult[]; total: number }>(
    apiUrl,
    fetcher
  );

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;
  const hasFilters = filters.demographic || filters.status || filters.orderBy || (filters.tags && filters.tags.length > 0);
  const showingResults = searchQuery || hasFilters;

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    setPage(0);
  };

  const handleFilters = (f: SearchFilters) => {
    setFilters(f);
    setPage(0);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <section className="mb-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-3 text-balance">
              Descubre tu proximo manga favorito
            </h1>
            <p className="text-muted-foreground text-lg">
              Busca y lee miles de mangas gratis
            </p>
          </div>
          <div className="flex justify-center mb-6">
            <SearchBar onSearch={handleSearch} initialQuery={searchQuery} />
          </div>
          <MangaFilters filters={filters} onFiltersChange={handleFilters} />
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-6">
            {showingResults
              ? `Resultados ${searchQuery ? `para "${searchQuery}"` : "con filtros"}`
              : "Mangas populares"}
          </h2>
          <MangaGrid manga={data?.data || []} isLoading={isLoading} />

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p - 1)}
                disabled={page === 0 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {page + 1} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={page >= totalPages - 1 || isLoading}
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {data && data.total > 0 && (
            <p className="text-center text-muted-foreground text-sm mt-3">
              {data.total.toLocaleString("es-AR")} resultados en total
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
