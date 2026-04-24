const MANGADEX_API = "https://api.mangadex.org";

export interface SearchFilters {
  demographic?: string;
  status?: string;
  tags?: string[];
  orderBy?: string;
}

export const DEMOGRAPHICS = [
  { value: "shounen", label: "Shounen" },
  { value: "shoujo", label: "Shoujo" },
  { value: "seinen", label: "Seinen" },
  { value: "josei", label: "Josei" },
];

export const STATUSES = [
  { value: "ongoing", label: "En curso" },
  { value: "completed", label: "Completado" },
  { value: "hiatus", label: "En pausa" },
  { value: "cancelled", label: "Cancelado" },
];

export const ORDER_OPTIONS = [
  { value: "relevance", label: "Relevancia" },
  { value: "followedCount", label: "Popularidad" },
  { value: "rating", label: "Calificacion" },
  { value: "latestUploadedChapter", label: "Reciente" },
  { value: "title", label: "Titulo A-Z" },
];

export const POPULAR_TAGS = [
  { id: "391b0423-d847-456f-aff0-8b0cfc03066b", name: "Action" },
  { id: "87cc87cd-a395-47af-b27a-93258283bbc6", name: "Adventure" },
  { id: "4d32cc48-9f00-4cca-9b5a-a839f0764984", name: "Comedy" },
  { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", name: "Drama" },
  { id: "cdc58593-87dd-415e-bbc0-2ec27bf404cc", name: "Fantasy" },
  { id: "ace04997-f6bd-436e-b261-779182193d3d", name: "Isekai" },
  { id: "a1f53773-c69a-4ce5-8cab-fffcd90b1565", name: "Magic" },
  { id: "799c202e-7daa-44eb-9cf7-8a3c0441531e", name: "Martial Arts" },
  { id: "ee968100-4191-4968-93d3-f82d72be7e46", name: "Mystery" },
  { id: "423e2eae-a7a2-4a8b-ac03-a8351462d71d", name: "Romance" },
  { id: "256c8bd9-4904-4360-bf4f-508a76571a84", name: "Sci-Fi" },
  { id: "e5301a23-ebd9-49dd-a0cb-2add944c7fe9", name: "Slice of Life" },
  { id: "69964a64-2f90-4d33-beeb-f3ed2875eb4c", name: "Sports" },
  { id: "07251805-a27e-4d59-b488-f0bfbec15168", name: "Thriller" },
];

export interface MangaSearchResult {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  status: string;
  year: number | null;
  contentRating: string;
  tags: string[];
}

export interface Chapter {
  id: string;
  chapter: string;
  title: string;
  volume: string | null;
  pages: number;
  publishAt: string;
  scanlationGroup: string;
  language?: string;
}

export interface ChapterPages {
  baseUrl: string;
  hash: string;
  data: string[];
  dataSaver: string[];
}

function getCoverUrl(mangaId: string, fileName: string): string {
  return `https://uploads.mangadex.org/covers/${mangaId}/${fileName}.256.jpg`;
}

export async function searchManga(
  query: string,
  limit = 20,
  offset = 0,
  filters?: SearchFilters
): Promise<{ data: MangaSearchResult[]; total: number }> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
    "includes[]": "cover_art",
    "contentRating[]": "safe",
  });

  if (query) {
    params.set("title", query);
  }

  if (filters?.demographic) {
    params.append("publicationDemographic[]", filters.demographic);
  }

  if (filters?.status) {
    params.append("status[]", filters.status);
  }

  if (filters?.tags && filters.tags.length > 0) {
    filters.tags.forEach(tagId => {
      params.append("includedTags[]", tagId);
    });
  }

  const orderBy = filters?.orderBy || "relevance";
  params.set(`order[${orderBy}]`, "desc");

  const response = await fetch(`${MANGADEX_API}/manga?${params}`);
  const json = await response.json();

  if (!Array.isArray(json.data)) return { data: [], total: 0 };

  const results: MangaSearchResult[] = json.data.map((manga: any) => {
    const attributes = manga.attributes;
    const coverRel = manga.relationships.find(
      (r: any) => r.type === "cover_art"
    );
    const coverFileName = coverRel?.attributes?.fileName || "";

    return {
      id: manga.id,
      title:
        attributes.title.en ||
        attributes.title["ja-ro"] ||
        Object.values(attributes.title)[0] ||
        "Sin título",
      description:
        attributes.description?.en ||
        attributes.description?.["es-la"] ||
        attributes.description?.["es"] ||
        Object.values(attributes.description || {})[0] ||
        "",
      coverUrl: coverFileName ? getCoverUrl(manga.id, coverFileName) : "",
      status: attributes.status,
      year: attributes.year,
      contentRating: attributes.contentRating,
      tags: attributes.tags
        .map((t: any) => t.attributes.name.en)
        .filter(Boolean),
    };
  });

  return { data: results, total: json.total ?? 0 };
}

export async function getPopularManga(
  limit = 20,
  filters?: SearchFilters,
  offset = 0
): Promise<{ data: MangaSearchResult[]; total: number }> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
    "includes[]": "cover_art",
    "contentRating[]": "safe",
  });

  if (filters?.demographic) {
    params.append("publicationDemographic[]", filters.demographic);
  }

  if (filters?.status) {
    params.append("status[]", filters.status);
  }

  if (filters?.tags && filters.tags.length > 0) {
    filters.tags.forEach(tagId => {
      params.append("includedTags[]", tagId);
    });
  }

  const orderBy = filters?.orderBy || "followedCount";
  params.set(`order[${orderBy}]`, "desc");

  const response = await fetch(`${MANGADEX_API}/manga?${params}`);
  const json = await response.json();

  if (!Array.isArray(json.data)) return { data: [], total: 0 };

  const results: MangaSearchResult[] = json.data.map((manga: any) => {
    const attributes = manga.attributes;
    const coverRel = manga.relationships.find(
      (r: any) => r.type === "cover_art"
    );
    const coverFileName = coverRel?.attributes?.fileName || "";

    return {
      id: manga.id,
      title:
        attributes.title.en ||
        attributes.title["ja-ro"] ||
        Object.values(attributes.title)[0] ||
        "Sin título",
      description:
        attributes.description?.en ||
        attributes.description?.["es-la"] ||
        attributes.description?.["es"] ||
        Object.values(attributes.description || {})[0] ||
        "",
      coverUrl: coverFileName ? getCoverUrl(manga.id, coverFileName) : "",
      status: attributes.status,
      year: attributes.year,
      contentRating: attributes.contentRating,
      tags: attributes.tags
        .map((t: any) => t.attributes.name.en)
        .filter(Boolean),
    };
  });

  return { data: results, total: json.total ?? 0 };
}

export async function getMangaDetails(
  mangaId: string
): Promise<MangaSearchResult | null> {
  const params = new URLSearchParams({
    "includes[]": "cover_art",
  });

  const response = await fetch(`${MANGADEX_API}/manga/${mangaId}?${params}`);
  const json = await response.json();

  if (!json.data) return null;

  const manga = json.data;
  const attributes = manga.attributes;
  const coverRel = manga.relationships.find((r: any) => r.type === "cover_art");
  const coverFileName = coverRel?.attributes?.fileName || "";

  return {
    id: manga.id,
    title:
      attributes.title.en ||
      attributes.title["ja-ro"] ||
      Object.values(attributes.title)[0] ||
      "Sin título",
    description:
      attributes.description?.en ||
      attributes.description?.["es-la"] ||
      attributes.description?.["es"] ||
      Object.values(attributes.description || {})[0] ||
      "",
    coverUrl: coverFileName ? getCoverUrl(manga.id, coverFileName) : "",
    status: attributes.status,
    year: attributes.year,
    contentRating: attributes.contentRating,
    tags: attributes.tags.map((t: any) => t.attributes.name.en).filter(Boolean),
  };
}

export const LANGUAGES = [
  { value: "es-la", label: "Espanol (Latam)" },
  { value: "es", label: "Espanol (Espana)" },
  { value: "en", label: "Ingles" },
  { value: "pt-br", label: "Portugues" },
];

export async function getMangaChapters(
  mangaId: string,
  limit = 100,
  offset = 0,
  languages: string[] = ["es-la", "es", "en", "pt-br", "ja", "ko", "zh", "zh-hk", "fr", "de", "it", "ru"]
): Promise<{ data: Chapter[]; total: number }> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
    "order[chapter]": "asc",
    "includes[]": "scanlation_group",
  });

  languages.forEach(lang => {
    params.append("translatedLanguage[]", lang);
  });

  // Use the feed endpoint — /chapter?manga= hits a "Non-feed limit" restriction
  const response = await fetch(`${MANGADEX_API}/manga/${mangaId}/feed?${params}`);

  if (!response.ok) {
    console.error(`MangaDex feed error ${response.status} for ${mangaId}`);
    return { data: [], total: 0 };
  }

  const text = await response.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    console.error("MangaDex returned non-JSON:", text.slice(0, 200));
    return { data: [], total: 0 };
  }

  if (!Array.isArray(json.data)) {
    console.error("MangaDex unexpected shape:", json);
    return { data: [], total: 0 };
  }

  const chapters: Chapter[] = json.data.map((chapter: any) => {
    const groupRel = chapter.relationships.find(
      (r: any) => r.type === "scanlation_group"
    );

    return {
      id: chapter.id,
      chapter: chapter.attributes.chapter || "0",
      title: chapter.attributes.title || "",
      volume: chapter.attributes.volume,
      pages: chapter.attributes.pages,
      publishAt: chapter.attributes.publishAt,
      scanlationGroup: groupRel?.attributes?.name || "Unknown",
      language: chapter.attributes.translatedLanguage,
    };
  });

  return { data: chapters, total: json.total ?? 0 };
}

export async function getChapterPages(chapterId: string): Promise<ChapterPages> {
  const response = await fetch(`${MANGADEX_API}/at-home/server/${chapterId}`);
  if (!response.ok) throw new Error(`at-home ${response.status}`);
  const json = await response.json();
  if (!json.chapter) throw new Error("at-home returned no chapter data");

  return {
    baseUrl: json.baseUrl,
    hash: json.chapter.hash,
    data: json.chapter.data ?? [],
    dataSaver: json.chapter.dataSaver ?? [],
  };
}

export function getPageUrl(
  baseUrl: string,
  hash: string,
  fileName: string,
  quality: "data" | "dataSaver" = "dataSaver"
): string {
  // MangaDex uses "data-saver" in the URL path, not "dataSaver"
  const path = quality === "dataSaver" ? "data-saver" : "data";
  return `${baseUrl}/${path}/${hash}/${fileName}`;
}
