import { ANIME } from "@consumet/extensions";

const provider = new ANIME.AnimeKai();

function mapResults(results: any) {
  return (results.results || []).map((r: any) => ({
    id: r.id as string,
    title: typeof r.title === "string" ? r.title : r.title?.english || r.title?.romaji || "",
    image: r.image || null,
    type: r.type || null,
    releaseDate: r.releaseDate || null,
    hasSub: r.hasSub ?? r.isSubbed ?? null,
    hasDub: r.hasDub ?? r.isDubbed ?? null,
  }));
}

function wrapBrowse(fn: (page: number) => Promise<any>) {
  return async (page = 1) => {
    const results = await fn(page);
    return { results: mapResults(results), hasNextPage: results.hasNextPage ?? false };
  };
}

export async function searchAnimeStreaming(query: string, page = 1) {
  const results = await provider.search(query, page);
  return { results: mapResults(results), hasNextPage: results.hasNextPage ?? false };
}

export async function getAnimeEpisodes(animeId: string) {
  const info = await provider.fetchAnimeInfo(animeId);
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

export const getNewReleases = wrapBrowse((p) => provider.fetchNewReleases(p));
export const getRecentlyUpdated = wrapBrowse((p) => provider.fetchRecentlyUpdated(p));
export const getTVAnime = wrapBrowse((p) => provider.fetchTV(p));

export async function getSpotlight() {
  const results = await provider.fetchSpotlight();
  return { results: mapResults(results), hasNextPage: false };
}

