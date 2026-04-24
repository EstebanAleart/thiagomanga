"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import useSWR from "swr";
import {
  ArrowLeft, Heart, BookOpen, Calendar, Tag,
  ChevronDown, ChevronUp, Loader2, Star, Users, ExternalLink, Pen, BookMarked,
} from "lucide-react";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import type { MangaSearchResult, Chapter } from "@/lib/mangadex";
import type { AniListManga } from "@/lib/anilist";
import { stripHtml } from "@/lib/anilist";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface MangaPageProps {
  params: Promise<{ id: string }>;
}

const LANGUAGE_FLAGS: Record<string, string> = {
  "es-la": "🇦🇷",
  "es": "🇪🇸",
  "en": "🇬🇧",
  "pt-br": "🇧🇷",
  "ja": "🇯🇵",
  "ko": "🇰🇷",
  "zh": "🇨🇳",
  "zh-hk": "🇭🇰",
  "fr": "🇫🇷",
  "de": "🇩🇪",
  "it": "🇮🇹",
  "ru": "🇷🇺",
};

const LANGUAGE_LABELS: Record<string, string> = {
  "es-la": "Español (Latam)",
  "es": "Español (España)",
  "en": "English",
  "pt-br": "Português",
  "ja": "日本語",
  "ko": "한국어",
  "zh": "中文",
  "zh-hk": "中文 (HK)",
  "fr": "Français",
  "de": "Deutsch",
  "it": "Italiano",
  "ru": "Русский",
};

const RELATION_LABELS: Record<string, string> = {
  ADAPTATION: "Adaptación",
  PREQUEL: "Precuela",
  SEQUEL: "Secuela",
  SIDE_STORY: "Historia paralela",
  SPIN_OFF: "Spin-off",
  ALTERNATIVE: "Alternativa",
  SUMMARY: "Resumen",
  CHARACTER: "Personaje",
  OTHER: "Otro",
};

export default function MangaPage({ params }: MangaPageProps) {
  const { id } = use(params);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedLang, setSelectedLang] = useState<string | null>(null);
  const [showAllChapters, setShowAllChapters] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const CHAPTERS_PREVIEW = 20;

  useEffect(() => {
    const favs = JSON.parse(localStorage.getItem("manga-favorites") || "[]");
    setIsFavorite(favs.some((f: any) => f.id === id));
  }, [id]);

  const { data: manga, isLoading: mangaLoading } = useSWR<MangaSearchResult>(
    `/api/manga/${id}`,
    fetcher
  );

  const { data: chaptersData, isLoading: chaptersLoading } = useSWR<{
    data: Chapter[];
    total: number;
  }>(`/api/manga/${id}/chapters?all=true`, fetcher);

  const { data: anilist } = useSWR<AniListManga | null>(
    manga ? `/api/anilist/manga?title=${encodeURIComponent(manga.title)}` : null,
    fetcher
  );

  const toggleFavorite = () => {
    const favs = JSON.parse(localStorage.getItem("manga-favorites") || "[]");
    if (isFavorite) {
      localStorage.setItem("manga-favorites", JSON.stringify(favs.filter((f: any) => f.id !== id)));
    } else if (manga) {
      favs.push({ id, title: manga.title, coverUrl: manga.coverUrl, status: manga.status, year: manga.year });
      localStorage.setItem("manga-favorites", JSON.stringify(favs));
    }
    setIsFavorite(!isFavorite);
  };

  const availableLanguages = chaptersData?.data
    ? [...new Set(chaptersData.data.map((c) => c.language).filter(Boolean))]
    : [];

  useEffect(() => {
    if (availableLanguages.length > 0 && !selectedLang) {
      const preferred = ["es-la", "es", "en", "pt-br"].find((l) => availableLanguages.includes(l));
      setSelectedLang(preferred || (availableLanguages[0] ?? null));
    }
  }, [availableLanguages.join(",")]);

  const filteredChapters = chaptersData?.data?.filter(
    (c) => !selectedLang || c.language === selectedLang
  ) || [];

  const displayedChapters = showAllChapters
    ? filteredChapters
    : filteredChapters.slice(0, CHAPTERS_PREVIEW);

  // AniList derived data
  const score = anilist?.averageScore ? (anilist.averageScore / 10).toFixed(1) : null;
  const authors = anilist?.staff.edges.filter((e) =>
    ["Story", "Art", "Story & Art"].some((r) => e.role.includes(r))
  ) ?? [];
  const description = anilist?.description
    ? stripHtml(anilist.description)
    : manga?.description || "";
  const animeRelations = anilist?.relations.edges.filter((e) => e.node.type === "ANIME") ?? [];
  const mangaRelations = anilist?.relations.edges.filter(
    (e) => e.node.type === "MANGA" && ["SEQUEL", "PREQUEL", "SPIN_OFF", "SIDE_STORY"].includes(e.relationType)
  ) ?? [];

  if (mangaLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Spinner className="w-8 h-8 text-primary" />
        </div>
      </div>
    );
  }

  if (!manga) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8 text-center">
          <p className="text-muted-foreground text-lg">Manga no encontrado</p>
          <Button asChild className="mt-4"><Link href="/">Volver al inicio</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Banner */}
      {anilist?.bannerImage && (
        <div className="w-full h-48 md:h-64 overflow-hidden relative">
          <img
            src={`/api/proxy-image?url=${encodeURIComponent(anilist.bannerImage)}`}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
        </div>
      )}

      <main className="container py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
        </Button>

        <div className="grid md:grid-cols-[280px_1fr] gap-8 mb-8">
          {/* Cover */}
          <div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-xl">
            {manga.coverUrl ? (
              <img
                src={`/api/proxy-image?url=${encodeURIComponent(
                  anilist?.coverImage.extraLarge || manga.coverUrl
                )}`}
                alt={manga.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-muted flex items-center justify-center">
                <BookOpen className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1 text-balance">{manga.title}</h1>
            {anilist?.title.native && (
              <p className="text-muted-foreground text-sm mb-4">{anilist.title.native}</p>
            )}

            {/* Badges row */}
            <div className="flex flex-wrap gap-2 mb-4">
              {manga.status && (
                <Badge className="bg-secondary text-secondary-foreground">
                  {manga.status === "ongoing" ? "En curso"
                    : manga.status === "completed" ? "Completado"
                    : manga.status === "hiatus" ? "En pausa"
                    : manga.status === "cancelled" ? "Cancelado"
                    : manga.status}
                </Badge>
              )}
              {manga.year && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {manga.year}
                </Badge>
              )}
              {anilist?.chapters && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <BookMarked className="h-3 w-3" />
                  {anilist.chapters} caps
                </Badge>
              )}
              {score && (
                <Badge className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30 flex items-center gap-1">
                  <Star className="h-3 w-3 fill-current" />
                  {score}
                  <span className="text-xs opacity-70">/ 10</span>
                </Badge>
              )}
              {anilist?.popularity && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  #{anilist.popularity}
                </Badge>
              )}
            </div>

            {/* Staff */}
            {authors.length > 0 && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
                {authors.map((e, i) => (
                  <p key={i} className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{e.role}: </span>
                    {e.node.name.full}
                  </p>
                ))}
              </div>
            )}

            {/* Genres */}
            <div className="flex flex-wrap gap-1 mb-4">
              {(anilist?.genres ?? manga.tags).slice(0, 10).map((g) => (
                <Badge key={g} variant="outline" className="text-xs">
                  <Tag className="h-3 w-3 mr-1" />
                  {g}
                </Badge>
              ))}
            </div>

            {/* Description */}
            {description && (
              <div className="mb-5">
                <p className={`text-muted-foreground leading-relaxed text-sm ${descExpanded ? "" : "line-clamp-5"}`}>
                  {description}
                </p>
                {description.length > 300 && (
                  <button
                    onClick={() => setDescExpanded(!descExpanded)}
                    className="text-xs text-primary mt-1 hover:underline"
                  >
                    {descExpanded ? "Ver menos" : "Ver más"}
                  </button>
                )}
              </div>
            )}

            {/* Popularity stat */}
            {anilist?.favourites && (
              <p className="text-xs text-muted-foreground mb-5 flex items-center gap-1">
                <Heart className="h-3 w-3" />
                {anilist.favourites.toLocaleString("es-AR")} favoritos en AniList
              </p>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={toggleFavorite}
                variant={isFavorite ? "default" : "outline"}
                className="flex items-center gap-2"
              >
                <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
                {isFavorite ? "En favoritos" : "Agregar a favoritos"}
              </Button>
              {anilist?.siteUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a href={anilist.siteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Ver en AniList
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Relations */}
        {(animeRelations.length > 0 || mangaRelations.length > 0) && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BookMarked className="h-4 w-4" />
                Relacionados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 flex-wrap">
                {[...animeRelations, ...mangaRelations].map(({ relationType, node }) => (
                  <a
                    key={node.id}
                    href={node.siteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors min-w-[200px] max-w-[280px]"
                  >
                    <img
                      src={`/api/proxy-image?url=${encodeURIComponent(node.coverImage.large)}`}
                      alt={node.title.english || node.title.romaji}
                      className="w-10 h-14 object-cover rounded shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">
                        {node.title.english || node.title.romaji}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {RELATION_LABELS[relationType] || relationType} · {node.type === "ANIME" ? "Anime" : "Manga"}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chapters */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Capítulos ({chaptersData?.data ? filteredChapters.length : "..."})
              </CardTitle>

              {availableLanguages.length > 1 && (
                <div className="flex gap-2 flex-wrap">
                  {availableLanguages.map((lang) => (
                    <Button
                      key={lang}
                      size="sm"
                      variant={selectedLang === lang ? "default" : "outline"}
                      onClick={() => setSelectedLang(lang!)}
                      className="text-xs"
                    >
                      {LANGUAGE_FLAGS[lang!] || "🌐"} {LANGUAGE_LABELS[lang!] || lang}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {chaptersLoading ? (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Cargando capítulos...</p>
              </div>
            ) : filteredChapters.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No hay capítulos disponibles en este idioma
              </p>
            ) : (
              <>
                <div className="grid gap-2">
                  {displayedChapters.map((chapter) => (
                    <Link
                      key={chapter.id}
                      href={`/read/${chapter.id}?mangaId=${id}`}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-primary min-w-[4rem]">
                          Cap. {chapter.chapter}
                        </span>
                        {chapter.title && (
                          <span className="text-muted-foreground text-sm truncate max-w-[200px]">
                            {chapter.title}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground hidden sm:block">
                          {chapter.scanlationGroup}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(chapter.publishAt).toLocaleDateString("es-AR", {
                            day: "2-digit", month: "2-digit", year: "2-digit",
                          })}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>

                {filteredChapters.length > CHAPTERS_PREVIEW && (
                  <Button
                    variant="ghost"
                    className="w-full mt-4"
                    onClick={() => setShowAllChapters(!showAllChapters)}
                  >
                    {showAllChapters ? (
                      <><ChevronUp className="h-4 w-4 mr-2" /> Mostrar menos</>
                    ) : (
                      <><ChevronDown className="h-4 w-4 mr-2" /> Ver todos los {filteredChapters.length} capítulos</>
                    )}
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
