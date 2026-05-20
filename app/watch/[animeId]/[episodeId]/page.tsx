"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Header } from "@/components/header";
import { VideoPlayer } from "@/components/video-player";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { ArrowLeft, Play, ChevronLeft, ChevronRight } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface EpisodeSource {
  sources: { url: string; quality: string; isM3U8: boolean }[];
  subtitles: { url: string; lang: string }[];
  intro: { start: number; end: number } | null;
  outro: { start: number; end: number } | null;
}

interface AnimeInfo {
  id: string;
  title: string;
  episodes: { id: string; number: number; title: string | null }[];
}

interface Props {
  params: Promise<{ animeId: string; episodeId: string }>;
}

export default function WatchEpisodePage({ params }: Props) {
  const { animeId, episodeId } = use(params);
  const decodedEpisodeId = decodeURIComponent(episodeId);
  const router = useRouter();

  const { data: sources, isLoading: sourcesLoading } = useSWR<EpisodeSource>(
    `/api/streaming/sources?id=${encodeURIComponent(decodedEpisodeId)}`,
    fetcher
  );

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
  const nextEp = anime?.episodes && currentEpIndex < anime.episodes.length - 1
    ? anime.episodes[currentEpIndex + 1]
    : null;

  const goToEpisode = (ep: { id: string }) => {
    router.push(`/watch/${encodeURIComponent(animeId)}/${encodeURIComponent(ep.id)}`);
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Minimal header for watch mode */}
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
        {sourcesLoading ? (
          <div className="aspect-video flex items-center justify-center bg-black">
            <Spinner className="w-10 h-10 text-primary" />
          </div>
        ) : sources && sources.sources.length > 0 ? (
          <VideoPlayer
            sources={sources.sources}
            subtitles={sources.subtitles}
            intro={sources.intro}
            outro={sources.outro}
            onPrevEpisode={prevEp ? () => goToEpisode(prevEp) : undefined}
            onNextEpisode={nextEp ? () => goToEpisode(nextEp) : undefined}
          />
        ) : (
          <div className="aspect-video flex items-center justify-center bg-black">
            <div className="text-center">
              <Play className="h-12 w-12 text-white/30 mx-auto mb-3" />
              <p className="text-white/50">No se pudieron cargar las fuentes de video</p>
            </div>
          </div>
        )}
      </div>

      {/* Episode list below player */}
      {anime && anime.episodes.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 py-6">
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
