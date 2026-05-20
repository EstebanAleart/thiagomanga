import { NextRequest, NextResponse } from "next/server";
import { searchJikanAnime, getTopAnime } from "@/lib/jikan";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const q = sp.get("q");
  const page = parseInt(sp.get("page") || "1");

  try {
    if (q) {
      const data = await searchJikanAnime(q, page);
      return NextResponse.json(data);
    }
    const filter = (sp.get("filter") || "airing") as "airing" | "upcoming" | "bypopularity" | "favorite";
    const data = await getTopAnime(filter, page);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Jikan anime error:", error);
    return NextResponse.json({ data: [], pagination: { has_next_page: false } });
  }
}
