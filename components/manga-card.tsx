"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { MangaSearchResult } from "@/lib/mangadex";

interface MangaCardProps {
  manga: MangaSearchResult;
}

export function MangaCard({ manga }: MangaCardProps) {
  return (
    <Link href={`/manga/${manga.id}`}>
      <Card className="group overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer h-full">
        <div className="relative aspect-[2/3] overflow-hidden">
          {manga.coverUrl ? (
            <img
              src={`/api/proxy-image?url=${encodeURIComponent(manga.coverUrl)}`}
              alt={manga.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 bg-muted flex items-center justify-center">
              <span className="text-muted-foreground text-sm">Sin imagen</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <CardContent className="p-3">
          <h3 className="font-semibold text-sm line-clamp-2 text-card-foreground mb-2">
            {manga.title}
          </h3>
          <div className="flex flex-wrap gap-1">
            {manga.status && (
              <Badge
                variant="secondary"
                className="text-xs bg-secondary text-secondary-foreground"
              >
                {manga.status === "ongoing" ? "En curso" : manga.status === "completed" ? "Completado" : manga.status}
              </Badge>
            )}
            {manga.year && (
              <Badge variant="outline" className="text-xs">
                {manga.year}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
