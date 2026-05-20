import { NextRequest, NextResponse } from "next/server";
import { searchAnimeStreaming } from "@/lib/consumet";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  if (!query) return NextResponse.json({ results: [], hasNextPage: false });

  const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
  try {
    const data = await searchAnimeStreaming(query, page);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Streaming search error:", error);
    return NextResponse.json({ results: [], hasNextPage: false });
  }
}
