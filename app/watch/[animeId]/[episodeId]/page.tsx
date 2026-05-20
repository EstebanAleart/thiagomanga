"use client";

import { use, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  ArrowLeft,
  Play,
  ChevronLeft,
  ChevronRight,
  Search,
  Youtube,
  Eye,
  Clock,
  ExternalLink,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  duration: string | null;
  viewCount: string | null;
}

interface YouTubeSearchResult {
  videos: YouTubeVideo[];
  nextPageToken: string | null;
  error?: string;
}

interface AnimeInfo {
  id: string;
  title: string;
  episodes: { id: string; number: number; title: string | null }[];
}

interface Props {
  params: Promise<{ animeId: string; episodeId: string }>;
}

function formatDuration(iso: string | null): string {
  if (!iso) return "";
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return "";
  const h = parseInt(m[1] || "0");
  const min = parseInt(m[2] || "0");
  const sec = parseInt(m[3] || "0");
  if (h > 0) return `${h}:${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

function formatViews(count: string | null): string {
  if (!count) return "";
  const n = parseInt(count);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return `${n}`;
}

function buildSearchQuery(title: string, epNumber: number): string {
  return `${title} episodio ${epNumber} completo sub español`;
}

export default function WatchEpisodePage({ params }: Props) {
  const { animeId, episodeId } = use(params);
  const decodedEpisodeId = decodeURIComponent(episodeId);
  const router = useRouter();

  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [customQuery, setCustomQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState<string | null>(null);

  const { data: anime } = useSWR<AnimeInfo>(
    `/api/streaming/episodes?id=${encodeURIComponent(animeId)}`,
    fetcher
  );

  const currentEpIndex = useMemo(() => {
    if (!anime?.episodes) return -1;
    return anime.episodes.findIndex((ep) => ep.id === decodedEpisodeId);
  }, [anime, decodedEpisodeId]);

  const currentEp = anime?.episodes[currentEpIndex];
  const prevEp = currentEpIndex > 0 ? anime?.episodes[currentEpIndex - 1] : null;
  const nextEp =
    anime?.episodes && currentEpIndex < anime.episodes.length - 1
      ? anime.episodes[currentEpIndex + 1]
      : null;

  const autoQuery = useMemo(() => {
    if (!anime?.title || !currentEp) return null;
    return buildSearchQuery(anime.title, currentEp.number);
  }, [anime, currentEp]);

  const searchQuery = activeQuery || autoQuery;

  const { data: ytResults, isLoading: ytLoading } = useSWR<YouTubeSearchResult>(
    searchQuery ? `/api/youtube/search?q=${encodeURIComponent(searchQuery)}` : null,
    fetcher
  );

  const playingVideoId = selectedVideo || ytResults?.videos?.[0]?.id || null;

  const goToEpisode = useCallback(
    (ep: { id: string }) => {
      setSelectedVideo(null);
      setActiveQuery(null);
      setCustomQuery("");
      router.push(`/watch/${encodeURIComponent(animeId)}/${encodeURIComponent(ep.id)}`);
    },
    [animeId, router]
  );

  const handleCustomSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (customQuery.trim()) {
      setActiveQuery(customQuery.trim());
      setSelectedVideo(null);
    }
  };

  const resetSearch = () => {
    setActiveQuery(null);
    setCustomQuery("");
    setSelectedVideo(null);
  };

  const embedUrl = playingVideoId
    ? `https://www.youtube.com/embed/${playingVideoId}?autoplay=1&rel=0&modestbranding=1&fs=1&iv_load_policy=3`
    : null;

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-black/90 border-b border-white/10">
        <div className="container flex items-center justify-between h-12">
          <div className="flex items-center gap-3">
            <Link
              href={`/watch/${encodeURIComponent(animeId)}`}
              className="text-white/60 hover:text-white flex items-center gap-1 text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Link>
            {anime && currentEp && (
              <span className="text-white/80 text-sm">
                {anime.title} — Ep. {currentEp.number}
                {currentEp.title ? `: ${currentEp.title}` : ""}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {prevEp && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => goToEpisode(prevEp)}
                className="text-white/60 hover:text-white hover:bg-white/10 h-8"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
            )}
            {nextEp && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => goToEpisode(nextEp)}
                className="text-white/60 hover:text-white hover:bg-white/10 h-8"
              >
                Siguiente
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Player */}
      <div className="w-full max-w-6xl mx-auto">
        {ytLoading && !playingVideoId ? (
          <div className="aspect-video flex items-center justify-center bg-black">
            <div className="text-center">
              <Spinner className="w-10 h-10 text-primary mx-auto mb-3" />
              <p className="text-white/50 text-sm">Buscando en YouTube...</p>
            </div>
          </div>
        ) : embedUrl ? (
          <>
            <iframe
              key={playingVideoId}
              src={embedUrl}
              className="w-full aspect-video border-0"
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              allowFullScreen
            />
            <div className="flex items-center justify-end px-2 py-1.5 bg-zinc-900/80">
              <a
                href={`https://www.youtube.com/watch?v=${playingVideoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/50 hover:text-white text-xs flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                Ver en YouTube (si no carga)
              </a>
            </div>
          </>
        ) : (
          <div className="aspect-video flex items-center justify-center bg-black">
            <div className="text-center">
              <Play className="h-12 w-12 text-white/30 mx-auto mb-3" />
              <p className="text-white/50">
                {ytResults?.error
                  ? "Error buscando en YouTube"
                  : "No se encontraron videos"}
              </p>
              {ytResults?.error && (
                <p className="text-white/30 text-xs mt-2 max-w-md">{ytResults.error}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* YouTube search bar */}
      <div className="max-w-6xl mx-auto px-4 pt-4">
        <form onSubmit={handleCustomSearch} className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <input
              type="text"
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              placeholder={autoQuery || "Buscar en YouTube..."}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/30"
            />
          </div>
          <Button
            type="submit"
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white h-[38px] px-4"
          >
            <Youtube className="h-4 w-4 mr-1.5" />
            Buscar
          </Button>
          {activeQuery && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetSearch}
              className="text-white/60 hover:text-white hover:bg-white/10 h-[38px]"
            >
              Reset
            </Button>
          )}
        </form>
      </div>

      {/* YouTube results */}
      {ytResults?.videos && ytResults.videos.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h3 className="text-white/60 text-xs font-medium mb-3 uppercase tracking-wider">
            Resultados de YouTube
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {ytResults.videos.map((video) => (
              <button
                key={video.id}
                onClick={() => setSelectedVideo(video.id)}
                className={`text-left rounded-lg overflow-hidden transition-all ${
                  playingVideoId === video.id
                    ? "ring-2 ring-red-500 bg-white/10"
                    : "bg-white/5 hover:bg-white/10"
                }`}
              >
                <div className="relative">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full aspect-video object-cover"
                  />
                  {video.duration && (
                    <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(video.duration)}
                    </span>
                  )}
                  {playingVideoId === video.id && (
                    <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                      <Play className="h-8 w-8 text-white fill-white" />
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-white/90 text-xs font-medium line-clamp-2 leading-tight">
                    {video.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-white/40 text-xs truncate">
                      {video.channelTitle}
                    </span>
                    {video.viewCount && (
                      <span className="text-white/30 text-xs flex items-center gap-0.5 shrink-0">
                        <Eye className="h-3 w-3" />
                        {formatViews(video.viewCount)}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Episode list */}
      {anime && anime.episodes.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 py-6 border-t border-white/5">
          <h3 className="text-white/80 font-semibold text-sm mb-3">Episodios</h3>
          <div className="flex flex-wrap gap-2">
            {anime.episodes.map((ep) => (
              <button
                key={ep.id}
                onClick={() => goToEpisode(ep)}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${
                  ep.id === decodedEpisodeId
                    ? "bg-primary text-primary-foreground"
                    : "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"
                }`}
              >
                {ep.number}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
