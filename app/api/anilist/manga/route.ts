import { NextRequest, NextResponse } from "next/server";
import { getAniListMangaByTitle } from "@/lib/anilist";

export async function GET(request: NextRequest) {
  const title = request.nextUrl.searchParams.get("title");
  if (!title) return NextResponse.json(null);

  try {
    const manga = await getAniListMangaByTitle(title);
    return NextResponse.json(manga);
  } catch (error) {
    console.error("AniList error:", error);
    return NextResponse.json(null);
  }
}
