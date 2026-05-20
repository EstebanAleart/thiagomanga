import { NextRequest, NextResponse } from "next/server";
import { searchAnimeStreaming, getNewReleases, getRecentlyUpdated, getTVAnime } from "@/lib/consumet";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const page = parseInt(sp.get("page") || "1");

  try {
    // Search by query
    const query = sp.get("q");
    if (query) {
      const data = await searchAnimeStreaming(query, page);
      return NextResponse.json(data);
    }

    // Browse by category
    const cat = sp.get("cat") || "new";
    switch (cat) {
      case "recent":
        return NextResponse.json(await getRecentlyUpdated(page));
      case "tv":
        return NextResponse.json(await getTVAnime(page));
      default:
        return NextResponse.json(await getNewReleases(page));
    }
  } catch (error) {
    console.error("Streaming search error:", error);
    return NextResponse.json({ results: [], hasNextPage: false });
  }
}
