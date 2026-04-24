const ANILIST_API = "https://graphql.anilist.co";

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

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&#039;/g, "'").trim();
}
