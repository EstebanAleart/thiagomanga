import { NextRequest, NextResponse } from "next/server";
import {
  getTrendingAnime,
  getSeasonalAnimeAL,
  searchAniListAnime,
  getAniListAnimeById,
} from "@/lib/anilist";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const page = parseInt(sp.get("page") || "1");

  try {
    // By ID
    const id = sp.get("id");
    if (id) {
      const anime = await getAniListAnimeById(parseInt(id));
      if (!anime) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(anime);
    }

    // Search
    const search = sp.get("search");
    if (search) {
      const data = await searchAniListAnime(search, page);
      return NextResponse.json(data);
    }

    // Seasonal
    const season = sp.get("season");
    const year = sp.get("year");
    if (season && year) {
      const data = await getSeasonalAnimeAL(season, parseInt(year), page);
      return NextResponse.json(data);
    }

    // Default: trending
    const data = await getTrendingAnime(page);
    return NextResponse.json(data);
  } catch (error) {
    console.error("AniList anime error:", error);
    return NextResponse.json({ media: [], total: 0 });
  }
}
