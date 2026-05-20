const JIKAN_API = "https://api.jikan.moe/v4";

export interface JikanManga {
  mal_id: number;
  url: string;
  title: string;
  title_english: string | null;
  title_japanese: string | null;
  score: number | null;
  scored_by: number | null;
  rank: number | null;
  popularity: number | null;
  members: number | null;
  favorites: number | null;
  synopsis: string | null;
  background: string | null;
  status: string;
  chapters: number | null;
  volumes: number | null;
  authors: Array<{ mal_id: number; name: string; url: string }>;
  serialization: Array<{ mal_id: number; name: string; url: string }>;
  genres: Array<{ mal_id: number; name: string }>;
  themes: Array<{ mal_id: number; name: string }>;
  demographics: Array<{ mal_id: number; name: string }>;
  images: {
    jpg: { image_url: string; large_image_url: string };
    webp: { image_url: string; large_image_url: string };
  };
}

export interface JikanAnime {
  mal_id: number;
  url: string;
  title: string;
  title_english: string | null;
  title_japanese: string | null;
  episodes: number | null;
  status: string;
  airing: boolean;
  score: number | null;
  scored_by: number | null;
  rank: number | null;
  popularity: number | null;
  members: number | null;
  synopsis: string | null;
  season: string | null;
  year: number | null;
  studios: Array<{ mal_id: number; name: string }>;
  genres: Array<{ mal_id: number; name: string }>;
  themes: Array<{ mal_id: number; name: string }>;
  demographics: Array<{ mal_id: number; name: string }>;
  images: {
    jpg: { image_url: string; large_image_url: string };
    webp: { image_url: string; large_image_url: string };
  };
  trailer: { youtube_id: string | null; url: string | null } | null;
  broadcast: { string: string | null } | null;
  source: string | null;
  rating: string | null;
  type: string | null;
}

export interface JikanRecommendation {
  entry: Array<{
    mal_id: number;
    url: string;
    title: string;
    images: { jpg: { image_url: string; large_image_url: string } };
  }>;
  content: string;
  user: { username: string };
}

interface JikanPagination {
  last_visible_page: number;
  has_next_page: boolean;
}

// ── Manga ──

export async function searchJikanManga(title: string): Promise<JikanManga | null> {
  const params = new URLSearchParams({ q: title, limit: "1", type: "manga" });
  const response = await fetch(`${JIKAN_API}/manga?${params}`, {
    next: { revalidate: 3600 },
  });
  if (!response.ok) return null;
  const json = await response.json();
  return json.data?.[0] ?? null;
}

export async function getTopManga(
  filter: "publishing" | "upcoming" | "bypopularity" | "favorite" = "bypopularity",
  page = 1,
  limit = 25
): Promise<{ data: JikanManga[]; pagination: JikanPagination }> {
  const params = new URLSearchParams({ filter, page: String(page), limit: String(limit) });
  const res = await fetch(`${JIKAN_API}/top/manga?${params}`, { next: { revalidate: 3600 } });
  if (!res.ok) return { data: [], pagination: { last_visible_page: 1, has_next_page: false } };
  return res.json();
}

// ── Anime ──

export async function searchJikanAnime(
  query: string,
  page = 1,
  limit = 20
): Promise<{ data: JikanAnime[]; pagination: JikanPagination }> {
  const params = new URLSearchParams({ q: query, page: String(page), limit: String(limit) });
  const res = await fetch(`${JIKAN_API}/anime?${params}`, { next: { revalidate: 3600 } });
  if (!res.ok) return { data: [], pagination: { last_visible_page: 1, has_next_page: false } };
  return res.json();
}

export async function getAnimeById(id: number): Promise<JikanAnime | null> {
  const res = await fetch(`${JIKAN_API}/anime/${id}`, { next: { revalidate: 3600 } });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data ?? null;
}

export async function getTopAnime(
  filter: "airing" | "upcoming" | "bypopularity" | "favorite" = "airing",
  page = 1,
  limit = 25
): Promise<{ data: JikanAnime[]; pagination: JikanPagination }> {
  const params = new URLSearchParams({ filter, page: String(page), limit: String(limit) });
  const res = await fetch(`${JIKAN_API}/top/anime?${params}`, { next: { revalidate: 3600 } });
  if (!res.ok) return { data: [], pagination: { last_visible_page: 1, has_next_page: false } };
  return res.json();
}

export async function getSeasonNow(
  page = 1
): Promise<{ data: JikanAnime[]; pagination: JikanPagination }> {
  const res = await fetch(`${JIKAN_API}/seasons/now?page=${page}&limit=25`, { next: { revalidate: 3600 } });
  if (!res.ok) return { data: [], pagination: { last_visible_page: 1, has_next_page: false } };
  return res.json();
}

export async function getSeasonalAnime(
  year: number,
  season: "winter" | "spring" | "summer" | "fall",
  page = 1
): Promise<{ data: JikanAnime[]; pagination: JikanPagination }> {
  const res = await fetch(`${JIKAN_API}/seasons/${year}/${season}?page=${page}&limit=25`, { next: { revalidate: 3600 } });
  if (!res.ok) return { data: [], pagination: { last_visible_page: 1, has_next_page: false } };
  return res.json();
}

export async function getAnimeSchedule(
  day?: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday"
): Promise<{ data: JikanAnime[] }> {
  const url = day ? `${JIKAN_API}/schedules?filter=${day}` : `${JIKAN_API}/schedules`;
  const res = await fetch(url, { next: { revalidate: 1800 } });
  if (!res.ok) return { data: [] };
  return res.json();
}

export async function getAnimeRecommendations(
  animeId: number
): Promise<JikanRecommendation[]> {
  const res = await fetch(`${JIKAN_API}/anime/${animeId}/recommendations`, { next: { revalidate: 3600 } });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}
