import { NextRequest, NextResponse } from "next/server";
import { getSeasonNow, getSeasonalAnime } from "@/lib/jikan";

type Season = "winter" | "spring" | "summer" | "fall";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const page = parseInt(sp.get("page") || "1");

  try {
    if (sp.get("now") === "true") {
      const data = await getSeasonNow(page);
      return NextResponse.json(data);
    }
    const year = parseInt(sp.get("year") || String(new Date().getFullYear()));
    const season = (sp.get("season") || "spring") as Season;
    const data = await getSeasonalAnime(year, season, page);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Jikan seasons error:", error);
    return NextResponse.json({ data: [], pagination: { has_next_page: false } });
  }
}
