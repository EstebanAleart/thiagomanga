import { ANIME, SubOrSub } from "@consumet/extensions";

const hianime = new ANIME.Hianime();

export async function searchAnimeStreaming(query: string, page = 1) {
  const results = await hianime.search(query, page);
  return {
    results: results.results.map((r) => ({
      id: r.id as string,
      title: typeof r.title === "string" ? r.title : r.title?.english || r.title?.romaji || "",
      image: r.image || null,
      type: r.type || null,
      releaseDate: r.releaseDate || null,
      hasSub: (r as any).hasSub ?? null,
      hasDub: (r as any).hasDub ?? null,
    })),
    hasNextPage: results.hasNextPage ?? false,
  };
}

export async function getAnimeEpisodes(animeId: string) {
  const info = await hianime.fetchAnimeInfo(animeId);
  return {
    id: info.id,
    title: typeof info.title === "string" ? info.title : info.title?.english || info.title?.romaji || "",
    image: info.image || null,
    description: info.description || null,
    totalEpisodes: info.totalEpisodes || 0,
    hasSub: info.hasSub ?? false,
    hasDub: info.hasDub ?? false,
    episodes: (info.episodes || []).map((ep) => ({
      id: ep.id,
      number: ep.number,
      title: ep.title || null,
      isFiller: ep.isFiller ?? false,
    })),
  };
}

export async function getEpisodeSources(episodeId: string, subOrDub: "sub" | "dub" = "sub") {
  const mode = subOrDub === "dub" ? SubOrSub.DUB : SubOrSub.SUB;
  const sources = await hianime.fetchEpisodeSources(episodeId, undefined, mode);
  return {
    sources: sources.sources.map((s) => ({
      url: s.url,
      quality: s.quality || "default",
      isM3U8: s.isM3U8 ?? false,
    })),
    subtitles: (sources.subtitles || []).map((s) => ({
      url: s.url,
      lang: s.lang || "Unknown",
    })),
    intro: sources.intro || null,
    outro: sources.outro || null,
  };
}
