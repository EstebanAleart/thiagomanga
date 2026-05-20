"use client";

import Link from "next/link";
import { Star, Tv, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Countdown } from "@/components/countdown";
import type { AniListAnime } from "@/lib/anilist";

const STATUS_LABELS: Record<string, string> = {
  RELEASING: "En emisi\u00f3n",
  FINISHED: "Finalizado",
  NOT_YET_RELEASED: "Pr\u00f3ximamente",
  CANCELLED: "Cancelado",
  HIATUS: "En pausa",
};

const FORMAT_LABELS: Record<string, string> = {
  TV: "TV",
  TV_SHORT: "TV Corto",
  MOVIE: "Pel\u00edcula",
  SPECIAL: "Especial",
  OVA: "OVA",
  ONA: "ONA",
  MUSIC: "M\u00fasica",
};

interface AnimeCardProps {
  anime: AniListAnime;
}

export function AnimeCard({ anime }: AnimeCardProps) {
  const score = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : null;
  const studio = anime.studios?.nodes?.[0]?.name;

  return (
    <Link href={`/anime/${anime.id}`} className="group flex flex-col gap-2">
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted">
        {anime.coverImage?.large ? (
          <img
            src={anime.coverImage.large}
            alt={anime.title.romaji}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Tv className="h-8 w-8 text-muted-foreground/40" />
          </div>
        )}

        {/* Status badge */}
        {anime.status && (
          <Badge className="absolute top-1 left-1 text-[10px] px-1 py-0 bg-black/70 text-white border-0">
            {STATUS_LABELS[anime.status] || anime.status}
          </Badge>
        )}

        {/* Format badge */}
        {anime.format && anime.format !== "TV" && (
          <Badge className="absolute top-1 right-1 text-[10px] px-1 py-0 bg-primary/80 text-primary-foreground border-0">
            {FORMAT_LABELS[anime.format] || anime.format}
          </Badge>
        )}

        {/* Episodes badge */}
        {anime.episodes && (
          <Badge className="absolute bottom-1 right-1 text-[10px] px-1 py-0 bg-black/70 text-white border-0 flex items-center gap-0.5">
            <Play className="h-2 w-2 fill-current" />
            {anime.episodes} eps
          </Badge>
        )}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">
          {anime.title.romaji}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {score && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
              {score}
            </span>
          )}
          {studio && (
            <span className="text-[10px] text-muted-foreground truncate">
              {studio}
            </span>
          )}
        </div>
        {anime.nextAiringEpisode && (
          <Countdown
            airingAt={anime.nextAiringEpisode.airingAt}
            episode={anime.nextAiringEpisode.episode}
          />
        )}
      </div>
    </Link>
  );
}
