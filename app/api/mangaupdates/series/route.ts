import { NextRequest, NextResponse } from "next/server";
import { getMUSeriesDetail, searchMUSeriesByTitle } from "@/lib/mangaupdates";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;

  // By MU ID
  const id = sp.get("id");
  if (id) {
    try {
      const data = await getMUSeriesDetail(parseInt(id));
      return NextResponse.json(data);
    } catch (error) {
      console.error("MangaUpdates detail error:", error);
      return NextResponse.json(null, { status: 404 });
    }
  }

  // By title (search + get first match's full detail)
  const title = sp.get("title");
  if (title) {
    try {
      const data = await searchMUSeriesByTitle(title);
      return NextResponse.json(data);
    } catch (error) {
      console.error("MangaUpdates title search error:", error);
      return NextResponse.json(null);
    }
  }

  return NextResponse.json(null);
}
