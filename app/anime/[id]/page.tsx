"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import useSWR from "swr";
import {
  ArrowLeft, Star, Users, Tag, ChevronDown, ChevronUp, Tv, Play,
  Heart, ExternalLink, Calendar,
} from "lucide-react";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Countdown } from "@/components/countdown";
import type { AniListAnime } from "@/lib/anilist";
import type { JikanRecommendation } from "@/lib/jikan";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const STATUS_LABELS: Record<string, string> = {
  RELEASING: "En emisi\u00f3n",
  FINISHED: "Finalizado",
  NOT_YET_RELEASED: "Pr\u00f3ximamente",
  CANCELLED: "Cancelado",
  HIATUS: "En pausa",
};

const FORMAT_LABELS: Record<string, string> = {
  TV: "TV", TV_SHORT: "TV Corto", MOVIE: "Pel\u00edcula",
  SPECIAL: "Especial", OVA: "OVA", ONA: "ONA", MUSIC: "M\u00fasica",
};

const STREAMING_SITES = ["Crunchyroll", "Netflix", "Funimation", "HIDIVE", "Amazon Prime Video", "Disney Plus", "Hulu"];

interface Props { params: Promise<{ id: string }> }

export default function AnimeDetailPage({ params }: Props) {
  const { id } = use(params);
  const [descExpanded, setDescExpanded] = useState(false);
  const [isFav, setIsFav] = useState(false);

  const { data: anime, isLoading } = useSWR<AniListAnime>(
    `/api/anilist/anime?id=${id}`,
    fetcher
  );

  const { data: recs } = useSWR<JikanRecommendation[]>(
    anime ? `/api/jikan/anime/${id}/recommendations` : null,
    fetcher
  );

  // Favorites
  useEffect(() => {
    const favs = JSON.parse(localStorage.getItem("anime-favorites") || "[]");
    setIsFav(favs.some((f: any) => f.id === parseInt(id)));
  }, [id]);

  const toggleFav = () => {
    if (!anime) return;
    const favs = JSON.parse(localStorage.getItem("anime-favorites") || "[]");
    if (isFav) {
      const updated = favs.filter((f: any) => f.id !== anime.id);
      localStorage.setItem("anime-favorites", JSON.stringify(updated));
      setIsFav(false);
    } else {
      favs.push({
        id: anime.id,
        title: anime.title.romaji,
        coverUrl: anime.coverImage?.extraLarge || anime.coverImage?.large,
        status: anime.status,
        episodes: anime.episodes,
        score: anime.averageScore,
      });
      localStorage.setItem("anime-favorites", JSON.stringify(favs));
      setIsFav(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Spinner className="w-8 h-8 text-primary" />
        </div>
      </div>
    );
  }

  if (!anime) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8 text-center">
          <p className="text-muted-foreground">Anime no encontrado</p>
          <Button asChild className="mt-4"><Link href="/anime">Volver</Link></Button>
        </div>
      </div>
    );
  }

  const score = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : null;
  const desc = anime.description || "";
  const streamingLinks = anime.externalLinks?.filter((l) => STREAMING_SITES.includes(l.site)) ?? [];
  const relations = anime.relations?.edges ?? [];
  const staff = anime.staff?.edges ?? [];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Banner */}
      {anime.bannerImage && (
        <div className="relative h-48 md:h-64 overflow-hidden">
          <img src={anime.bannerImage} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        </div>
      )}

      <main className="container py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/anime" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Anime
          </Link>
        </Button>

        <div className="grid md:grid-cols-[260px_1fr] gap-8 mb-8">
          {/* Cover */}
          <div className="relative">
            <div className="aspect-[2/3] rounded-xl overflow-hidden shadow-xl">
              <img
                src={anime.coverImage?.extraLarge || anime.coverImage?.large}
                alt={anime.title.romaji}
                className="w-full h-full object-cover"
              />
            </div>
            <Button
              onClick={toggleFav}
              variant={isFav ? "default" : "outline"}
              className="w-full mt-3"
            >
              <Heart className={`h-4 w-4 mr-2 ${isFav ? "fill-current" : ""}`} />
              {isFav ? "En favoritos" : "Agregar a favoritos"}
            </Button>
          </div>

          {/* Info */}
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1 text-balance">{anime.title.romaji}</h1>
            {anime.title.native && (
              <p className="text-sm text-muted-foreground mb-4">{anime.title.native}</p>
            )}

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {anime.status && (
                <Badge className="bg-secondary text-secondary-foreground">
                  {STATUS_LABELS[anime.status] || anime.status}
                </Badge>
              )}
              {anime.format && (
                <Badge variant="outline">{FORMAT_LABELS[anime.format] || anime.format}</Badge>
              )}
              {anime.episodes && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Play className="h-3 w-3" />
                  {anime.episodes} episodios
                </Badge>
              )}
              {score && (
                <Badge className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30 flex items-center gap-1">
                  <Star className="h-3 w-3 fill-current" />
                  {score}
                </Badge>
              )}
              {anime.popularity && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {anime.popularity.toLocaleString("es-AR")}
                </Badge>
              )}
              {anime.season && anime.seasonYear && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {anime.season} {anime.seasonYear}
                </Badge>
              )}
            </div>

            {/* Next episode countdown */}
            {anime.nextAiringEpisode && (
              <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20 inline-flex items-center gap-2">
                <Tv className="h-4 w-4 text-primary" />
                <Countdown airingAt={anime.nextAiringEpisode.airingAt} episode={anime.nextAiringEpisode.episode} />
              </div>
            )}

            {/* Studios */}
            {anime.studios?.nodes?.length > 0 && (
              <p className="text-sm text-muted-foreground mb-2">
                <span className="font-medium text-foreground">Estudio: </span>
                {anime.studios.nodes.map((s) => s.name).join(", ")}
              </p>
            )}

            {/* Staff */}
            {staff.length > 0 && (
              <p className="text-sm text-muted-foreground mb-3">
                <span className="font-medium text-foreground">Staff: </span>
                {staff.map((s) => `${s.node.name.full} (${s.role})`).join(", ")}
              </p>
            )}

            {/* Genres */}
            <div className="flex flex-wrap gap-1 mb-4">
              {anime.genres?.slice(0, 10).map((g) => (
                <Badge key={g} variant="outline" className="text-xs">
                  <Tag className="h-3 w-3 mr-1" />
                  {g}
                </Badge>
              ))}
            </div>

            {/* Description */}
            {desc && (
              <div className="mb-5">
                <p className={`text-muted-foreground text-sm leading-relaxed ${descExpanded ? "" : "line-clamp-5"}`}>
                  {desc}
                </p>
                {desc.length > 300 && (
                  <button onClick={() => setDescExpanded(!descExpanded)} className="text-xs text-primary mt-1 hover:underline">
                    {descExpanded ? "Ver menos" : "Ver m\u00e1s"}
                  </button>
                )}
              </div>
            )}

            {/* Trailer */}
            {anime.trailer?.id && anime.trailer.site === "youtube" && (
              <div className="mb-5">
                <h3 className="text-sm font-medium text-foreground mb-2">Trailer</h3>
                <div className="aspect-video rounded-lg overflow-hidden max-w-lg">
                  <iframe
                    src={`https://www.youtube.com/embed/${anime.trailer.id}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              </div>
            )}

            {/* Streaming links */}
            {streamingLinks.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {streamingLinks.map((link) => (
                  <Button key={link.url} variant="outline" size="sm" asChild>
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                      <ExternalLink className="h-3 w-3" />
                      {link.site}
                    </a>
                  </Button>
                ))}
              </div>
            )}

            {/* AniList link */}
            <Button variant="outline" size="sm" asChild>
              <a href={anime.siteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                Ver en AniList
              </a>
            </Button>
          </div>
        </div>

        {/* Relations */}
        {relations.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Relacionados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {relations.map((rel) => (
                  <Link
                    key={rel.node.id}
                    href={rel.node.type === "ANIME" ? `/anime/${rel.node.id}` : `/manga/${rel.node.id}`}
                    className="group flex flex-col gap-2"
                  >
                    <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted">
                      <img
                        src={rel.node.coverImage.large}
                        alt={rel.node.title.romaji}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                      <Badge className="absolute top-1 left-1 text-[10px] px-1 py-0 bg-black/70 text-white border-0">
                        {rel.relationType.replace(/_/g, " ")}
                      </Badge>
                      <Badge className="absolute bottom-1 right-1 text-[10px] px-1 py-0 bg-primary/80 text-primary-foreground border-0">
                        {rel.node.type}
                      </Badge>
                    </div>
                    <p className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {rel.node.title.romaji}
                    </p>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recommendations */}
        {recs && recs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recomendados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {recs.slice(0, 12).map((rec) => {
                  const other = rec.entry.find((e) => e.mal_id !== parseInt(id));
                  if (!other) return null;
                  return (
                    <a
                      key={other.mal_id}
                      href={other.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex flex-col gap-2"
                    >
                      <div className="aspect-[2/3] rounded-lg overflow-hidden bg-muted">
                        <img
                          src={other.images.jpg.large_image_url || other.images.jpg.image_url}
                          alt={other.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                      </div>
                      <p className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">
                        {other.title}
                      </p>
                    </a>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
