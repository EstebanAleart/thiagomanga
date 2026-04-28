"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Search, Image as ImageIcon, BookOpen, Star, X } from "lucide-react";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import type { DanbooruPost, DanbooruPool } from "@/lib/danbooru";
import { RATING_LABEL, formatTags } from "@/lib/danbooru";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Tab = "posts" | "pools";

export default function DanbooruPage() {
  const [tab, setTab] = useState<Tab>("posts");
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [page, setPage] = useState(1);
  const [lightbox, setLightbox] = useState<DanbooruPost | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const postsUrl = tab === "posts" && submitted !== undefined
    ? `/api/danbooru/posts?tags=${encodeURIComponent(submitted)}&page=${page}`
    : null;

  const poolsUrl = tab === "pools"
    ? `/api/danbooru/pools?q=${encodeURIComponent(submitted)}&page=${page}`
    : null;

  const { data: posts, isLoading: postsLoading } = useSWR<DanbooruPost[]>(postsUrl, fetcher);
  const { data: pools, isLoading: poolsLoading } = useSWR<DanbooruPool[]>(poolsUrl, fetcher);

  const isLoading = postsLoading || poolsLoading;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(query);
    setPage(1);
  };

  const switchTab = (t: Tab) => {
    setTab(t);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Danbooru</h1>
          <p className="text-muted-foreground text-sm">
            Ilustraciones y doujinshi. Busca por tags de personaje, serie o artista.
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-6 max-w-2xl">
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tab === "posts" ? "Ej: blue_archive 1girl, rouge_the_bat, touhou..." : "Ej: blue archive, touhou, naruto..."}
            className="flex-1"
          />
          <Button type="submit">
            <Search className="h-4 w-4 mr-2" />
            Buscar
          </Button>
        </form>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={tab === "posts" ? "default" : "outline"}
            size="sm"
            onClick={() => switchTab("posts")}
            className="flex items-center gap-2"
          >
            <ImageIcon className="h-4 w-4" />
            Ilustraciones
          </Button>
          <Button
            variant={tab === "pools" ? "default" : "outline"}
            size="sm"
            onClick={() => switchTab("pools")}
            className="flex items-center gap-2"
          >
            <BookOpen className="h-4 w-4" />
            Colecciones
          </Button>
        </div>

        {/* Tag tips */}
        {!submitted && (
          <div className="mb-8">
            <p className="text-xs text-muted-foreground mb-3">Tags populares para empezar:</p>
            <div className="flex flex-wrap gap-2">
              {["blue_archive", "genshin_impact", "touhou", "hololive", "fate_(series)", "arknights", "azur_lane"].map((tag) => (
                <button
                  key={tag}
                  onClick={() => { setQuery(tag); setSubmitted(tag); setPage(1); }}
                  className="text-xs px-3 py-1 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-20">
            <Spinner className="w-8 h-8 text-primary" />
          </div>
        )}

        {/* Posts grid */}
        {tab === "posts" && !isLoading && posts && (
          <>
            {posts.length === 0 ? (
              <p className="text-muted-foreground text-center py-16">Sin resultados para "{submitted}"</p>
            ) : (
              <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-2 space-y-2">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="break-inside-avoid cursor-pointer group relative overflow-hidden rounded-lg bg-muted"
                    onClick={() => setLightbox(post)}
                  >
                    <img
                      src={post.preview_file_url}
                      alt={post.tag_string_character || post.tag_string_copyright}
                      className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-200"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-end p-2 opacity-0 group-hover:opacity-100">
                      <div className="flex items-center gap-1 text-white text-xs">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {post.score}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Pools grid */}
        {tab === "pools" && !isLoading && pools && (
          <>
            {pools.length === 0 ? (
              <p className="text-muted-foreground text-center py-16">
                {submitted ? `Sin colecciones para "${submitted}"` : "Ingresá un término para buscar colecciones"}
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {pools.map((pool) => (
                  <Link
                    key={pool.id}
                    href={`/danbooru/pool/${pool.id}`}
                    className="group rounded-xl overflow-hidden bg-card border border-border hover:border-primary transition-colors"
                  >
                    <div className="aspect-[3/4] bg-muted flex items-center justify-center">
                      <BookOpen className="h-10 w-10 text-muted-foreground/40" />
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium truncate text-foreground group-hover:text-primary transition-colors">
                        {pool.name.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {pool.post_count} páginas · {pool.category === "series" ? "Serie" : "Colección"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {/* Pagination */}
        {((tab === "posts" && posts && posts.length > 0) || (tab === "pools" && pools && pools.length > 0)) && (
          <div className="flex justify-center gap-3 mt-10">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 1 || isLoading}>
              ← Anterior
            </Button>
            <span className="text-sm text-muted-foreground self-center">Página {page}</span>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={isLoading}>
              Siguiente →
            </Button>
          </div>
        )}
      </main>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white z-10"
            onClick={() => setLightbox(null)}
          >
            <X className="h-6 w-6" />
          </button>

          <div className="relative max-w-5xl max-h-[90vh] w-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightbox.large_file_url || lightbox.file_url}
              alt=""
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
            />

            {/* Tags panel */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/80 rounded-b-lg p-3">
              <div className="flex flex-wrap gap-1">
                {lightbox.tag_string_character && (
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                    {lightbox.tag_string_character.split(" ")[0].replace(/_/g, " ")}
                  </Badge>
                )}
                {lightbox.tag_string_copyright && (
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
                    {lightbox.tag_string_copyright.split(" ")[0].replace(/_/g, " ")}
                  </Badge>
                )}
                {lightbox.tag_string_artist && (
                  <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 text-xs">
                    {lightbox.tag_string_artist.split(" ")[0].replace(/_/g, " ")}
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs text-white/60 border-white/20">
                  {RATING_LABEL[lightbox.rating]}
                </Badge>
                <Badge variant="outline" className="text-xs text-white/60 border-white/20 flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {lightbox.score}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
