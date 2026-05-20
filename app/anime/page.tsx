"use client";

import { useState } from "react";
import useSWR from "swr";
import { Search, Loader2, TrendingUp, Calendar, Clock, Trophy } from "lucide-react";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimeCard } from "@/components/anime-card";
import type { AniListAnime } from "@/lib/anilist";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Tab = "trending" | "season" | "schedule" | "top";

const TABS: { id: Tab; label: string; icon: typeof TrendingUp }[] = [
  { id: "trending", label: "Tendencia", icon: TrendingUp },
  { id: "season", label: "Temporada", icon: Calendar },
  { id: "schedule", label: "Horario", icon: Clock },
  { id: "top", label: "Top", icon: Trophy },
];

const DAY_LABELS: Record<string, string> = {
  monday: "Lunes", tuesday: "Martes", wednesday: "Mi\u00e9rcoles",
  thursday: "Jueves", friday: "Viernes", saturday: "S\u00e1bado", sunday: "Domingo",
};

export default function AnimePage() {
  const [tab, setTab] = useState<Tab>("trending");
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [page, setPage] = useState(1);

  // Trending (AniList)
  const { data: trendingData, isLoading: trendingLoading } = useSWR<{ media: AniListAnime[]; total: number }>(
    tab === "trending" && !submitted ? `/api/anilist/anime?page=${page}` : null,
    fetcher
  );

  // Season (AniList)
  const now = new Date();
  const currentSeason = ["WINTER", "SPRING", "SUMMER", "FALL"][Math.floor(now.getMonth() / 3)];
  const { data: seasonData, isLoading: seasonLoading } = useSWR<{ media: AniListAnime[]; total: number }>(
    tab === "season" && !submitted ? `/api/anilist/anime?season=${currentSeason}&year=${now.getFullYear()}&page=${page}` : null,
    fetcher
  );

  // Schedule (Jikan)
  const { data: scheduleData, isLoading: scheduleLoading } = useSWR<{ data: any[] }>(
    tab === "schedule" && !submitted ? `/api/jikan/schedule` : null,
    fetcher
  );

  // Top (Jikan)
  const { data: topData, isLoading: topLoading } = useSWR<{ data: any[]; pagination: { has_next_page: boolean } }>(
    tab === "top" && !submitted ? `/api/jikan/anime?filter=bypopularity&page=${page}` : null,
    fetcher
  );

  // Search (AniList)
  const { data: searchData, isLoading: searchLoading } = useSWR<{ media: AniListAnime[]; total: number }>(
    submitted ? `/api/anilist/anime?search=${encodeURIComponent(submitted)}&page=${page}` : null,
    fetcher
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(query);
    setPage(1);
  };

  const clearSearch = () => {
    setQuery("");
    setSubmitted("");
    setPage(1);
  };

  const isLoading = trendingLoading || seasonLoading || scheduleLoading || topLoading || searchLoading;

  // Get anime list for current view
  let animeList: AniListAnime[] = [];
  let hasNext = false;

  if (submitted && searchData) {
    animeList = searchData.media ?? [];
    hasNext = animeList.length >= 20;
  } else if (tab === "trending" && trendingData) {
    animeList = trendingData.media ?? [];
    hasNext = animeList.length >= 20;
  } else if (tab === "season" && seasonData) {
    animeList = seasonData.media ?? [];
    hasNext = animeList.length >= 20;
  } else if (tab === "top" && topData) {
    // Jikan anime → map to AniListAnime-like shape for AnimeCard
    animeList = (topData.data ?? []).map((a: any) => ({
      id: a.mal_id,
      title: { romaji: a.title, english: a.title_english, native: a.title_japanese },
      episodes: a.episodes,
      status: a.airing ? "RELEASING" : a.status === "Finished Airing" ? "FINISHED" : null,
      format: a.type === "TV" ? "TV" : a.type === "Movie" ? "MOVIE" : a.type,
      genres: (a.genres ?? []).map((g: any) => g.name),
      averageScore: a.score ? a.score * 10 : null,
      popularity: a.members,
      favourites: null,
      coverImage: { large: a.images?.jpg?.large_image_url || a.images?.jpg?.image_url, extraLarge: a.images?.jpg?.large_image_url, color: null },
      bannerImage: null,
      siteUrl: a.url,
      season: a.season?.toUpperCase() ?? null,
      seasonYear: a.year,
      trailer: a.trailer,
      nextAiringEpisode: null,
      studios: { nodes: (a.studios ?? []).map((s: any) => ({ name: s.name, siteUrl: "" })) },
      externalLinks: [],
      description: a.synopsis,
      staff: { edges: [] },
      relations: { edges: [] },
    }));
    hasNext = topData.pagination?.has_next_page ?? false;
  }

  // Schedule grouped by day
  const scheduleByDay = tab === "schedule" && scheduleData?.data
    ? groupByDay(scheduleData.data)
    : {};

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Anime</h1>
          <p className="text-muted-foreground text-sm">Descubr\u00ed anime trending, de temporada y los m\u00e1s populares.</p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-6 max-w-xl">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar anime..."
            className="flex-1"
          />
          <Button type="submit">
            <Search className="h-4 w-4 mr-2" />
            Buscar
          </Button>
        </form>

        {submitted && (
          <div className="flex items-center gap-2 mb-6">
            <p className="text-sm text-muted-foreground">Resultados para &quot;{submitted}&quot;</p>
            <Button variant="ghost" size="sm" onClick={clearSearch} className="text-xs">
              Limpiar
            </Button>
          </div>
        )}

        {/* Tabs */}
        {!submitted && (
          <div className="flex gap-2 mb-8 flex-wrap">
            {TABS.map((t) => (
              <Button
                key={t.id}
                variant={tab === t.id ? "default" : "outline"}
                size="sm"
                onClick={() => { setTab(t.id); setPage(1); }}
                className="flex items-center gap-2"
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </Button>
            ))}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Schedule view (grouped by day) */}
        {tab === "schedule" && !submitted && !scheduleLoading && Object.keys(scheduleByDay).length > 0 && (
          <div className="space-y-8">
            {Object.entries(scheduleByDay).map(([day, items]) => (
              <div key={day}>
                <h2 className="text-lg font-semibold text-foreground mb-4">{DAY_LABELS[day] || day}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {(items as any[]).slice(0, 12).map((a: any) => (
                    <AnimeCard key={a.id} anime={a} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Grid view */}
        {tab !== "schedule" && !isLoading && animeList.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {animeList.map((anime) => (
              <AnimeCard key={anime.id} anime={anime} />
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && animeList.length === 0 && tab !== "schedule" && (
          <p className="text-center text-muted-foreground py-16">
            {submitted ? `Sin resultados para "${submitted}"` : "No hay datos disponibles"}
          </p>
        )}

        {/* Pagination */}
        {tab !== "schedule" && (animeList.length > 0 || page > 1) && (
          <div className="flex justify-center gap-3 mt-10">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 1 || isLoading}>
              \u2190 Anterior
            </Button>
            <span className="text-sm text-muted-foreground self-center">P\u00e1gina {page}</span>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={isLoading || !hasNext}>
              Siguiente \u2192
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

function groupByDay(data: any[]): Record<string, any[]> {
  const days: Record<string, any[]> = {};
  const dayOrder = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

  for (const anime of data) {
    // Jikan schedule returns anime with broadcast info
    const broadcastDay = anime.broadcast?.day?.toLowerCase() || "unknown";
    const day = dayOrder.includes(broadcastDay) ? broadcastDay : "unknown";

    // Map to AniListAnime-like shape for AnimeCard
    const mapped = {
      id: anime.mal_id,
      title: { romaji: anime.title, english: anime.title_english, native: anime.title_japanese },
      episodes: anime.episodes,
      status: anime.airing ? "RELEASING" : "FINISHED",
      format: anime.type === "TV" ? "TV" : anime.type,
      genres: (anime.genres ?? []).map((g: any) => g.name),
      averageScore: anime.score ? anime.score * 10 : null,
      popularity: anime.members,
      favourites: null,
      coverImage: { large: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url, extraLarge: null, color: null },
      bannerImage: null,
      siteUrl: anime.url,
      season: null,
      seasonYear: null,
      trailer: null,
      nextAiringEpisode: null,
      studios: { nodes: (anime.studios ?? []).map((s: any) => ({ name: s.name, siteUrl: "" })) },
      externalLinks: [],
      description: anime.synopsis,
      staff: { edges: [] },
      relations: { edges: [] },
    };

    if (!days[day]) days[day] = [];
    days[day].push(mapped);
  }

  // Sort by day order
  const sorted: Record<string, any[]> = {};
  for (const day of dayOrder) {
    if (days[day]?.length) sorted[day] = days[day];
  }
  if (days["unknown"]?.length) sorted["unknown"] = days["unknown"];
  return sorted;
}
