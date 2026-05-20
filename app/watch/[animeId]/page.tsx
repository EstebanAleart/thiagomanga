"use client";

import { use } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { ArrowLeft, Play, Subtitles, Mic } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface AnimeInfo {
  id: string;
  title: string;
  image: string | null;
  description: string | null;
  totalEpisodes: number;
  hasSub: boolean;
  hasDub: boolean;
  episodes: {
    id: string;
    number: number;
    title: string | null;
    isFiller: boolean;
  }[];
}

interface Props {
  params: Promise<{ animeId: string }>;
}

export default function WatchAnimePage({ params }: Props) {
  const { animeId } = use(params);

  const { data: anime, isLoading } = useSWR<AnimeInfo>(
    `/api/streaming/episodes?id=${encodeURIComponent(animeId)}`,
    fetcher
  );

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
          <p className="text-muted-foreground text-lg mb-4">No se pudo cargar el anime</p>
          <Button asChild><Link href="/watch">Volver</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/watch" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
        </Button>

        <div className="grid md:grid-cols-[250px_1fr] gap-8 mb-8">
          {/* Cover */}
          <div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-xl">
            {anime.image ? (
              <img
                src={anime.image}
                alt={anime.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-muted flex items-center justify-center">
                <Play className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-3">{anime.title}</h1>
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary">{anime.totalEpisodes} episodios</Badge>
              {anime.hasSub && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Subtitles className="h-3 w-3" /> SUB
                </Badge>
              )}
              {anime.hasDub && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Mic className="h-3 w-3" /> DUB
                </Badge>
              )}
            </div>
            {anime.description && (
              <p className="text-muted-foreground text-sm leading-relaxed line-clamp-4 mb-4">
                {anime.description}
              </p>
            )}
          </div>
        </div>

        {/* Episodes list */}
        <h2 className="text-xl font-bold text-foreground mb-4">Episodios</h2>
        <div className="grid gap-2">
          {anime.episodes.map((ep) => (
            <Link
              key={ep.id}
              href={`/watch/${encodeURIComponent(animeId)}/${encodeURIComponent(ep.id)}`}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <Play className="h-4 w-4 text-primary shrink-0" />
                <span className="font-bold text-primary min-w-[4rem]">Ep. {ep.number}</span>
                {ep.title && (
                  <span className="text-muted-foreground text-sm truncate max-w-[300px]">
                    {ep.title}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {ep.isFiller && (
                  <Badge variant="outline" className="text-xs text-yellow-500 border-yellow-500/30">
                    Filler
                  </Badge>
                )}
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
