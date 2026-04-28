const COMICK_API = "https://api.comick.fun";

export interface ComickManga {
  id: number;
  hid: string;
  slug: string;
  title: string;
  cover_url: string;
  desc: string | null;
  status: number; // 1=ongoing 2=completed 3=cancelled 4=hiatus
  country: string;
  rating: string | null;
  bayesian_rating: string | null;
  rating_count: number;
  follow_count: number;
  content_rating: string;
  demographic: number | null;
  genres: Array<{ id: number; name: string }>;
  md_titles?: Array<{ title: string; lang: string }>;
  links?: {
    al?: string;  // AniList ID
    mal?: string; // MyAnimeList ID
    mu?: string;  // MangaUpdates
  };
}

export interface ComickMangaDetail extends ComickManga {
  authors: Array<{ name: string; slug: string }>;
  artists: Array<{ name: string; slug: string }>;
  langList: string[];
}

export interface ComickChapter {
  id: number;
  hid: string;
  chap: string | null;
  title: string | null;
  lang: string;
  vol: string | null;
  group_name: string[];
  created_at: string;
  up_count: number;
}

export interface ComickPage {
  url: string;
  w: number;
  h: number;
}

async function comickFetch<T>(path: string, params: Record<string, string> = {}): Promise<T | null> {
  const url = new URL(`${COMICK_API}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  try {
    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "Tachiyomi/1.0" },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function searchComick(query: string, page = 1, limit = 20): Promise<ComickManga[]> {
  const results = await comickFetch<ComickManga[]>("/v1.0/search/", {
    q: query,
    limit: String(limit),
    page: String(page),
    tachiyomi: "true",
  });
  return Array.isArray(results) ? results : [];
}

export async function getComickManga(slug: string): Promise<ComickMangaDetail | null> {
  const data = await comickFetch<{ comic: ComickMangaDetail; artists: any[]; authors: any[]; langList: string[] }>(
    `/comic/${slug}`
  );
  if (!data?.comic) return null;
  return {
    ...data.comic,
    authors: data.authors ?? [],
    artists: data.artists ?? [],
    langList: data.langList ?? [],
  };
}

export async function getComickChapters(
  slug: string,
  page = 1,
  lang = "en"
): Promise<{ chapters: ComickChapter[]; total: number }> {
  const data = await comickFetch<{ chapters: ComickChapter[]; total: number }>(
    `/comic/${slug}/chapters`,
    { page: String(page), limit: "300", lang, tachiyomi: "true" }
  );
  return data ?? { chapters: [], total: 0 };
}

export async function getComickChapterPages(hid: string): Promise<ComickPage[]> {
  const data = await comickFetch<{ chapter: { images: ComickPage[] } }>(
    `/chapter/${hid}`,
    { tachiyomi: "true" }
  );
  return data?.chapter?.images ?? [];
}

export const COMICK_STATUS: Record<number, string> = {
  1: "En curso",
  2: "Completado",
  3: "Cancelado",
  4: "En pausa",
};

export function comickCover(url: string): string {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `https://meo.comick.pictures/${url}`;
}
