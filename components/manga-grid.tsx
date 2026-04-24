"use client";

import { MangaCard } from "./manga-card";
import { Spinner } from "@/components/ui/spinner";
import type { MangaSearchResult } from "@/lib/mangadex";

interface MangaGridProps {
  manga: MangaSearchResult[];
  isLoading?: boolean;
}

export function MangaGrid({ manga, isLoading }: MangaGridProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="w-8 h-8 text-primary" />
      </div>
    );
  }

  if (manga.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground text-lg">No se encontraron mangas</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {manga.map((m) => (
        <MangaCard key={m.id} manga={m} />
      ))}
    </div>
  );
}
