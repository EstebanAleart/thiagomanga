const DANBOORU_API = "https://danbooru.donmai.us";

export type DanbooruRating = "g" | "s" | "q" | "e";

export interface DanbooruPost {
  id: number;
  rating: DanbooruRating;
  score: number;
  fav_count: number;
  tag_string: string;
  tag_string_character: string;
  tag_string_copyright: string;
  tag_string_artist: string;
  tag_string_general: string;
  file_url: string;
  large_file_url: string;
  preview_file_url: string;
  image_width: number;
  image_height: number;
  file_ext: string;
  is_deleted: boolean;
  is_banned: boolean;
  created_at: string;
}

export interface DanbooruPool {
  id: number;
  name: string;
  description: string;
  post_count: number;
  category: "series" | "collection";
  is_active: boolean;
  is_deleted: boolean;
  post_ids: number[];
  updated_at: string;
}

async function danbooruFetch<T>(path: string, params: Record<string, string> = {}): Promise<T | null> {
  const url = new URL(`${DANBOORU_API}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const response = await fetch(url.toString());
  if (!response.ok) return null;
  const json = await response.json();
  return json as T;
}

export async function searchPosts(
  tags: string,
  page = 1,
  limit = 24
): Promise<DanbooruPost[]> {
  // Always enforce safe rating unless the user explicitly includes a rating tag
  const safeTags = tags.includes("rating:") ? tags.trim() : `${tags.trim()} rating:g,s`.trim();
  const posts = await danbooruFetch<DanbooruPost[]>("/posts.json", {
    tags: safeTags,
    page: String(page),
    limit: String(limit),
  });
  if (!Array.isArray(posts)) return [];
  return posts.filter((p) => !p.is_deleted && !p.is_banned && p.preview_file_url);
}

export async function searchPools(query: string, page = 1): Promise<DanbooruPool[]> {
  const pools = await danbooruFetch<DanbooruPool[]>("/pools.json", {
    "search[name_matches]": `*${query}*`,
    "search[is_deleted]": "false",
    "search[order]": "post_count",
    page: String(page),
    limit: "24",
  });
  return Array.isArray(pools) ? pools : [];
}

export async function getPool(poolId: number): Promise<DanbooruPool | null> {
  return danbooruFetch<DanbooruPool>(`/pools/${poolId}.json`);
}

export async function getPoolPosts(pool: DanbooruPool): Promise<DanbooruPost[]> {
  if (!pool.post_ids?.length) return [];

  // Fetch in batches of 200 (API max)
  const batches: DanbooruPost[][] = [];
  for (let i = 0; i < pool.post_ids.length; i += 200) {
    const batch = pool.post_ids.slice(i, i + 200);
    const posts = await danbooruFetch<DanbooruPost[]>("/posts.json", {
      "search[id]": batch.join(","),
      limit: "200",
    });
    if (Array.isArray(posts)) batches.push(posts);
  }

  const all = batches.flat().filter((p) => !p.is_deleted && !p.is_banned && p.file_url);
  // Restore pool order (API returns by id, not pool order)
  const orderMap = new Map(pool.post_ids.map((id, i) => [id, i]));
  return all.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));
}

export function formatTags(tagString: string): string[] {
  return tagString.split(" ").filter(Boolean).slice(0, 6);
}

export const RATING_LABEL: Record<DanbooruRating, string> = {
  g: "General",
  s: "Sensitive",
  q: "Questionable",
  e: "Explicit",
};
