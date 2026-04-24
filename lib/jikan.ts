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

export async function searchJikanManga(title: string): Promise<JikanManga | null> {
  const params = new URLSearchParams({ q: title, limit: "1", type: "manga" });
  const response = await fetch(`${JIKAN_API}/manga?${params}`, {
    next: { revalidate: 3600 },
  });
  if (!response.ok) return null;
  const json = await response.json();
  return json.data?.[0] ?? null;
}
