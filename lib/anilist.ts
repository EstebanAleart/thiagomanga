const ANILIST_API = "https://graphql.anilist.co";

// ── Manga types ──

export interface AniListManga {
  id: number;
  title: { romaji: string; english: string | null; native: string | null };
  description: string | null;
  chapters: number | null;
  volumes: number | null;
  status: string | null;
  startDate: { year: number | null; month: number | null; day: number | null };
  genres: string[];
  tags: Array<{ name: string; rank: number }>;
  coverImage: { large: string; extraLarge: string; color: string | null };
  bannerImage: string | null;
  averageScore: number | null;
  meanScore: number | null;
  popularity: number | null;
  favourites: number | null;
  siteUrl: string;
  staff: {
    edges: Array<{
      role: string;
      node: { name: { full: string }; siteUrl: string };
    }>;
  };
  relations: {
    edges: Array<{
      relationType: string;
      node: {
        id: number;
        title: { romaji: string; english: string | null };
        type: string;
        format: string | null;
        coverImage: { large: string };
        siteUrl: string;
      };
    }>;
  };
}

// ── Anime types ──

export interface AniListAnime {
  id: number;
  title: { romaji: string; english: string | null; native: string | null };
  description: string | null;
  episodes: number | null;
  status: string | null;
  season: string | null;
  seasonYear: number | null;
  format: string | null;
  genres: string[];
  averageScore: number | null;
  popularity: number | null;
  favourites: number | null;
  coverImage: { large: string; extraLarge: string; color: string | null };
  bannerImage: string | null;
  siteUrl: string;
  trailer: { id: string; site: string } | null;
  nextAiringEpisode: {
    airingAt: number;
    timeUntilAiring: number;
    episode: number;
  } | null;
  studios: { nodes: Array<{ name: string; siteUrl: string }> };
  externalLinks: Array<{ url: string; site: string; icon: string | null; color: string | null }>;
  staff: {
    edges: Array<{
      role: string;
      node: { name: { full: string }; siteUrl: string };
    }>;
  };
  relations: {
    edges: Array<{
      relationType: string;
      node: {
        id: number;
        title: { romaji: string; english: string | null };
        type: string;
        format: string | null;
        coverImage: { large: string };
        siteUrl: string;
      };
    }>;
  };
}

// ── GraphQL field fragments ──

const MANGA_FIELDS = `
  id
  title { romaji english native }
  description(asHtml: false)
  chapters
  volumes
  status
  startDate { year month day }
  genres
  tags(sort: RANK_DESC) { name rank }
  coverImage { large extraLarge color }
  bannerImage
  averageScore
  meanScore
  popularity
  favourites
  siteUrl
  staff(perPage: 4) {
    edges {
      role
      node { name { full } siteUrl }
    }
  }
  relations {
    edges {
      relationType
      node {
        id
        title { romaji english }
        type
        format
        coverImage { large }
        siteUrl
      }
    }
  }
`;

const ANIME_FIELDS = `
  id
  title { romaji english native }
  description(asHtml: false)
  episodes
  status
  season
  seasonYear
  format
  genres
  averageScore
  popularity
  favourites
  coverImage { large extraLarge color }
  bannerImage
  siteUrl
  trailer { id site }
  nextAiringEpisode { airingAt timeUntilAiring episode }
  studios(isMain: true) { nodes { name siteUrl } }
  externalLinks { url site icon color }
  staff(perPage: 4) {
    edges {
      role
      node { name { full } siteUrl }
    }
  }
  relations {
    edges {
      relationType
      node {
        id
        title { romaji english }
        type
        format
        coverImage { large }
        siteUrl
      }
    }
  }
`;

// ── Fetch helper ──

async function anilistFetch<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const response = await fetch(ANILIST_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 3600 },
  });
  if (!response.ok) throw new Error(`AniList HTTP ${response.status}`);
  const json = await response.json();
  if (json.errors) throw new Error(json.errors[0]?.message ?? "AniList error");
  return json.data;
}

// ── Manga queries ──

export async function getAniListMangaByTitle(title: string): Promise<AniListManga | null> {
  const query = `
    query ($search: String) {
      Page(page: 1, perPage: 1) {
        media(type: MANGA, search: $search, sort: POPULARITY_DESC) {
          ${MANGA_FIELDS}
        }
      }
    }
  `;
  const data = await anilistFetch<{ Page: { media: AniListManga[] } }>(query, { search: title });
  return data.Page.media[0] ?? null;
}

export async function getTrendingManga(page = 1, perPage = 20): Promise<{ media: AniListManga[]; total: number }> {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total }
        media(type: MANGA, sort: TRENDING_DESC, status_not: NOT_YET_RELEASED, countryOfOrigin: "JP") {
          ${MANGA_FIELDS}
        }
      }
    }
  `;
  const data = await anilistFetch<{
    Page: { pageInfo: { total: number }; media: AniListManga[] };
  }>(query, { page, perPage });
  return { media: data.Page.media, total: data.Page.pageInfo.total };
}

// ── Anime queries ──

export async function getTrendingAnime(page = 1, perPage = 20): Promise<{ media: AniListAnime[]; total: number; hasNextPage: boolean }> {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total hasNextPage }
        media(type: ANIME, sort: TRENDING_DESC, status_not: NOT_YET_RELEASED) {
          ${ANIME_FIELDS}
        }
      }
    }
  `;
  const data = await anilistFetch<{
    Page: { pageInfo: { total: number; hasNextPage: boolean }; media: AniListAnime[] };
  }>(query, { page, perPage });
  return { media: data.Page.media, total: data.Page.pageInfo.total, hasNextPage: data.Page.pageInfo.hasNextPage };
}

export async function getSeasonalAnimeAL(
  season: string,
  year: number,
  page = 1,
  perPage = 20
): Promise<{ media: AniListAnime[]; total: number; hasNextPage: boolean }> {
  const query = `
    query ($page: Int, $perPage: Int, $season: MediaSeason, $seasonYear: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total hasNextPage }
        media(type: ANIME, season: $season, seasonYear: $seasonYear, sort: POPULARITY_DESC) {
          ${ANIME_FIELDS}
        }
      }
    }
  `;
  const data = await anilistFetch<{
    Page: { pageInfo: { total: number; hasNextPage: boolean }; media: AniListAnime[] };
  }>(query, { page, perPage, season: season.toUpperCase(), seasonYear: year });
  return { media: data.Page.media, total: data.Page.pageInfo.total, hasNextPage: data.Page.pageInfo.hasNextPage };
}

export async function searchAniListAnime(
  search: string,
  page = 1,
  perPage = 20
): Promise<{ media: AniListAnime[]; total: number }> {
  const query = `
    query ($search: String, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total }
        media(type: ANIME, search: $search, sort: POPULARITY_DESC) {
          ${ANIME_FIELDS}
        }
      }
    }
  `;
  const data = await anilistFetch<{
    Page: { pageInfo: { total: number }; media: AniListAnime[] };
  }>(query, { search, page, perPage });
  return { media: data.Page.media, total: data.Page.pageInfo.total };
}

export async function getAniListAnimeById(id: number): Promise<AniListAnime | null> {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) { ${ANIME_FIELDS} }
    }
  `;
  const data = await anilistFetch<{ Media: AniListAnime }>(query, { id });
  return data.Media ?? null;
}

// ── Utils ──

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&#039;/g, "'").trim();
}
