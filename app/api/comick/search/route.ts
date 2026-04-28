import { NextRequest, NextResponse } from "next/server";
import { searchComick } from "@/lib/comick";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") || "";
  const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
  const limit = parseInt(request.nextUrl.searchParams.get("limit") || "20");

  try {
    const results = await searchComick(q, page, limit);
    return NextResponse.json(results);
  } catch (error) {
    console.error("ComicK search error:", error);
    return NextResponse.json([]);
  }
}
