const MU_API = "https://api.mangaupdates.com/v1";

// ---------- Interfaces ----------

export interface MUSeriesSearch {
  series_id: number;
  title: string;
  url: string;
  description: string;
  image: { url: { original: string; thumb: string } } | null;
  type: string;
  year: string;
  bayesian_rating: number;
  rating_votes: number;
  genres: { genre: string }[];
}

export interface MURank {
  position: { week: number; month: number; three_months: number; six_months: number; year: number };
  lists: { reading: number; wish: number; complete: number; unfinished: number; custom: number };
}

export interface MURecommendation {
  series_name: string;
  series_id: number;
  series_image: { url: { original: string; thumb: string } } | null;
  weight: number;
}

export interface MUPublisher {
  publisher_name: string;
  type: string;
  notes: string;
}

export interface MURelatedSeries {
  related_series_id: number;
  related_series_name: string;
  relation_type: string;
}

export interface MUSeriesDetail {
  series_id: number;
  title: string;
  url: string;
  description: string;
  image: { url: { original: string; thumb: string } } | null;
  type: string;
  year: string;
  bayesian_rating: number;
  rating_votes: number;
  genres: { genre: string }[];
  rank: MURank;
  licensed: boolean;
  completed: boolean;
  status: string;
  publishers: MUPublisher[];
  recommendations: MURecommendation[];
  related_series: MURelatedSeries[];
  authors: { name: string; type: string }[];
  anime: { start: string; end: string } | null;
}

// ---------- Fetcher ----------

async function muFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${MU_API}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`MU ${res.status} ${path}`);
  return res.json();
}

// ---------- Functions ----------

export async function searchMUSeries(query: string, page = 1): Promise<{
  results: MUSeriesSearch[];
  total: number;
}> {
  const data = await muFetch<{
    total_hits: number;
    results: { record: MUSeriesSearch }[];
  }>("/series/search", {
    method: "POST",
    body: JSON.stringify({ search: query, page, perpage: 25 }),
  });
  return {
    results: data.results.map((r) => r.record),
    total: data.total_hits,
  };
}

export async function getMUSeriesDetail(id: number): Promise<MUSeriesDetail> {
  return muFetch<MUSeriesDetail>(`/series/${id}`);
}

export async function searchMUSeriesByTitle(title: string): Promise<MUSeriesDetail | null> {
  const { results } = await searchMUSeries(title);
  if (results.length === 0) return null;
  // Get full detail of the best match
  return getMUSeriesDetail(results[0].series_id);
}
