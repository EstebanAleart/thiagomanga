import { NextRequest, NextResponse } from "next/server";
import { searchMUSeries } from "@/lib/mangaupdates";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const query = sp.get("q");
  if (!query) return NextResponse.json({ results: [], total: 0 });

  const page = parseInt(sp.get("page") || "1");
  try {
    const data = await searchMUSeries(query, page);
    return NextResponse.json(data);
  } catch (error) {
    console.error("MangaUpdates search error:", error);
    return NextResponse.json({ results: [], total: 0 });
  }
}
