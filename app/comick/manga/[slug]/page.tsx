"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import useSWR from "swr";
import { ArrowLeft, BookOpen, Star, Users, Tag, ChevronDown, ChevronUp, Loader2, ExternalLink } from "lucide-react";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import type { ComickMangaDetail, ComickChapter } from "@/lib/comick";
import { COMICK_STATUS, comickCover } from "@/lib/comick";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const LANG_FLAGS: Record<string, string> = {
  en: "🇬🇧", "es-la": "🇦🇷", es: "🇪🇸", "pt-br": "🇧🇷",
  ja: "🇯🇵", ko: "🇰🇷", zh: "🇨🇳", fr: "🇫🇷",
  de: "🇩🇪", it: "🇮🇹", ru: "🇷🇺", ar: "🇸🇦",
};

const LANG_LABELS: Record<string, string> = {
  en: "English", "es-la": "Español (Latam)", es: "Español",
  "pt-br": "Português", ja: "日本語", ko: "한국어",
  zh: "中文", fr: "Français", de: "Deutsch",
  it: "Italiano", ru: "Русский", ar: "العربية",
};

const CHAPTERS_PREVIEW = 30;

interface Props { params: Promise<{ slug: string }> }

export default function ComickMangaPage({ params }: Props) {
  const { slug } = use(params);
  const [selectedLang, setSelectedLang] = useState("en");
  const [showAll, setShowAll] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  const { data: mangaRaw, isLoading: mangaLoading } = useSWR<{ comic: ComickMangaDetail; authors: ComickMangaDetail["authors"]; artists: ComickMangaDetail["artists"]; langList: string[] }>(
    `https://api.comick.io/comic/${slug}`,
    fetcher
  );
  const manga: ComickMangaDetail | undefined = mangaRaw?.comic
    ? { ...mangaRaw.comic, authors: mangaRaw.authors ?? [], artists: mangaRaw.artists ?? [], langList: mangaRaw.langList ?? [] }
    : undefined;

  const { data: chaptersData, isLoading: chaptersLoading } = useSWR<{ chapters: ComickChapter[]; total: number }>(
    manga ? `https://api.comick.io/comic/${slug}/chapters?lang=${selectedLang}&limit=300` : null,
    fetcher
  );

  // Set default lang from available langs
  useEffect(() => {
    if (!manga?.langList?.length) return;
    const preferred = ["es-la", "es", "en"].find((l) => manga.langList.includes(l));
    setSelectedLang(preferred || manga.langList[0]);
  }, [manga?.slug]);

  const chapters = chaptersData?.chapters ?? [];
  const displayed = showAll ? chapters : chapters.slice(0, CHAPTERS_PREVIEW);

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
          <p className="text-muted-foreground">Manga no encontrado</p>
          <Button asChild className="mt-4"><Link href="/comick">Volver</Link></Button>
        </div>
      </div>
    );
  }

  const score = manga.bayesian_rating
    ? parseFloat(manga.bayesian_rating).toFixed(1)
    : manga.rating
    ? parseFloat(manga.rating).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">

        <Button variant="ghost" asChild className="mb-6">
          <Link href="/comick" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            ComicK
          </Link>
        </Button>

        <div className="grid md:grid-cols-[260px_1fr] gap-8 mb-8">
          {/* Cover */}
          <div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-xl">
            {manga.cover_url ? (
              <img
                src={`/api/proxy-image?url=${encodeURIComponent(comickCover(manga.cover_url))}`}
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
            <h1 className="text-3xl font-bold text-foreground mb-4 text-balance">{manga.title}</h1>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {manga.status && (
                <Badge className="bg-secondary text-secondary-foreground">
                  {COMICK_STATUS[manga.status] || "Desconocido"}
                </Badge>
              )}
              {score && (
                <Badge className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30 flex items-center gap-1">
                  <Star className="h-3 w-3 fill-current" />
                  {score}
                </Badge>
              )}
              {manga.follow_count > 0 && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {manga.follow_count.toLocaleString("es-AR")}
                </Badge>
              )}
              {manga.content_rating && manga.content_rating !== "safe" && (
                <Badge variant="outline">{manga.content_rating}</Badge>
              )}
            </div>

            {/* Authors */}
            {manga.authors?.length > 0 && (
              <p className="text-sm text-muted-foreground mb-2">
                <span className="font-medium text-foreground">Autor: </span>
                {manga.authors.map((a) => a.name).join(", ")}
              </p>
            )}
            {manga.artists?.length > 0 && manga.artists[0]?.name !== manga.authors?.[0]?.name && (
              <p className="text-sm text-muted-foreground mb-3">
                <span className="font-medium text-foreground">Arte: </span>
                {manga.artists.map((a) => a.name).join(", ")}
              </p>
            )}

            {/* Genres */}
            <div className="flex flex-wrap gap-1 mb-4">
              {manga.genres?.slice(0, 10).map((g) => (
                <Badge key={g.id} variant="outline" className="text-xs">
                  <Tag className="h-3 w-3 mr-1" />
                  {g.name}
                </Badge>
              ))}
            </div>

            {/* Description */}
            {manga.desc && (
              <div className="mb-5">
                <p className={`text-muted-foreground text-sm leading-relaxed ${descExpanded ? "" : "line-clamp-5"}`}>
                  {manga.desc}
                </p>
                {manga.desc.length > 300 && (
                  <button onClick={() => setDescExpanded(!descExpanded)} className="text-xs text-primary mt-1 hover:underline">
                    {descExpanded ? "Ver menos" : "Ver más"}
                  </button>
                )}
              </div>
            )}

            {/* AniList link */}
            {manga.links?.al && (
              <Button variant="outline" size="sm" asChild>
                <a href={`https://anilist.co/manga/${manga.links.al}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Ver en AniList
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Chapters */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Capítulos ({chaptersData ? chapters.length : "..."})
              </CardTitle>

              {/* Lang selector */}
              {manga.langList && manga.langList.length > 1 && (
                <div className="flex gap-2 flex-wrap">
                  {manga.langList.map((lang) => (
                    <Button
                      key={lang}
                      size="sm"
                      variant={selectedLang === lang ? "default" : "outline"}
                      onClick={() => setSelectedLang(lang)}
                      className="text-xs"
                    >
                      {LANG_FLAGS[lang] || "🌐"} {LANG_LABELS[lang] || lang}
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
            ) : chapters.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No hay capítulos en este idioma</p>
            ) : (
              <>
                <div className="grid gap-2">
                  {displayed.map((ch) => (
                    <Link
                      key={ch.hid}
                      href={`/comick/read/${ch.hid}?slug=${slug}&lang=${selectedLang}`}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-primary min-w-[4rem]">
                          Cap. {ch.chap ?? "?"}
                        </span>
                        {ch.title && (
                          <span className="text-muted-foreground text-sm truncate max-w-[200px]">
                            {ch.title}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {ch.group_name?.[0] && (
                          <span className="text-xs text-muted-foreground hidden sm:block truncate max-w-[120px]">
                            {ch.group_name[0]}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(ch.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>

                {chapters.length > CHAPTERS_PREVIEW && (
                  <Button variant="ghost" className="w-full mt-4" onClick={() => setShowAll(!showAll)}>
                    {showAll
                      ? <><ChevronUp className="h-4 w-4 mr-2" /> Mostrar menos</>
                      : <><ChevronDown className="h-4 w-4 mr-2" /> Ver todos los {chapters.length} capítulos</>
                    }
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
