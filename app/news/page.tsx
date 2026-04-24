"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Search, ExternalLink, BookOpen, Tv } from "lucide-react";
import type { ANNTitle } from "@/lib/ann";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function NewsPage() {
  const [query, setQuery] = useState("");
  const [inputVal, setInputVal] = useState("");
  const [type, setType] = useState<"anime" | "manga">("anime");
  const [nskip, setNskip] = useState(0);
  const NLIST = 50;

  const apiUrl = query
    ? `/api/ann/search?q=${encodeURIComponent(query)}&type=${type}`
    : `/api/ann/search?type=${type}&nskip=${nskip}&nlist=${NLIST}`;

  const { data, isLoading } = useSWR<{ data: ANNTitle[]; total: number }>(apiUrl, fetcher);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(inputVal);
    setNskip(0);
  };

  const clearSearch = () => {
    setQuery("");
    setInputVal("");
    setNskip(0);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-foreground">Enciclopedia ANN</h1>
            <a
              href="https://www.animenewsnetwork.com/encyclopedia/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 border border-border rounded px-2 py-1"
            >
              <ExternalLink className="h-3 w-3" /> Anime News Network
            </a>
          </div>
          <p className="text-muted-foreground text-sm">
            Base de datos de anime y manga de Anime News Network
          </p>
        </div>

        {/* Search + type filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder={`Buscar ${type === "anime" ? "anime" : "manga"}...`}
                className="pl-9"
              />
            </div>
            <Button type="submit" disabled={isLoading}>Buscar</Button>
            {query && (
              <Button type="button" variant="ghost" onClick={clearSearch}>Limpiar</Button>
            )}
          </form>
          <div className="flex gap-2">
            <Button
              variant={type === "anime" ? "default" : "outline"}
              size="sm"
              onClick={() => { setType("anime"); setQuery(""); setInputVal(""); setNskip(0); }}
              className="flex items-center gap-2"
            >
              <Tv className="h-4 w-4" /> Anime
            </Button>
            <Button
              variant={type === "manga" ? "default" : "outline"}
              size="sm"
              onClick={() => { setType("manga"); setQuery(""); setInputVal(""); setNskip(0); }}
              className="flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4" /> Manga
            </Button>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner className="w-8 h-8 text-primary" />
          </div>
        ) : data?.data.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            No se encontraron resultados
          </div>
        ) : (
          <>
            <div className="text-sm text-muted-foreground mb-4">
              {query
                ? `${data?.total || 0} resultado(s) para "${query}"`
                : `Mostrando títulos ${nskip + 1}–${nskip + (data?.data.length || 0)}`}
            </div>
            <div className="grid gap-2">
              {data?.data.map((title) => (
                <ANNTitleRow key={title.id} title={title} />
              ))}
            </div>

            {/* Pagination (only when not searching) */}
            {!query && (
              <div className="flex items-center justify-center gap-3 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setNskip(Math.max(0, nskip - NLIST))}
                  disabled={nskip === 0 || isLoading}
                >
                  ← Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                  Página {Math.floor(nskip / NLIST) + 1}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setNskip(nskip + NLIST)}
                  disabled={!data?.data.length || data.data.length < NLIST || isLoading}
                >
                  Siguiente →
                </Button>
              </div>
            )}
          </>
        )}

        {/* ANN attribution - required by ToS */}
        <p className="text-xs text-muted-foreground text-center mt-10 border-t pt-6">
          Datos provistos por{" "}
          <a href="https://www.animenewsnetwork.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">
            Anime News Network
          </a>
          . Ver detalles completos en la{" "}
          <a href="https://www.animenewsnetwork.com/encyclopedia/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">
            Enciclopedia ANN
          </a>.
        </p>
      </main>
    </div>
  );
}

function ANNTitleRow({ title }: { title: ANNTitle }) {
  const annUrl = `https://www.animenewsnetwork.com/encyclopedia/${title.type}.php?id=${title.id}`;

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group">
      <div className="flex items-center gap-3 min-w-0">
        <Badge variant="outline" className="text-xs shrink-0">
          {title.type === "anime" ? "🎬" : "📖"} {title.type}
        </Badge>
        <div className="min-w-0">
          <span className="font-medium text-foreground truncate block">{title.name}</span>
          {title.vintage && (
            <span className="text-xs text-muted-foreground">{title.vintage}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href={`/ann/${title.id}?type=${title.type}`}
          className="text-xs text-primary hover:underline px-2 py-1 rounded hover:bg-primary/10"
        >
          Ver detalles
        </Link>
        <a
          href={annUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
          title="Ver en ANN"
        >
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
