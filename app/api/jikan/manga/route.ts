import { NextRequest, NextResponse } from "next/server";
import { searchJikanManga } from "@/lib/jikan";

export async function GET(request: NextRequest) {
  const title = request.nextUrl.searchParams.get("title");
  if (!title) return NextResponse.json(null);

  try {
    const manga = await searchJikanManga(title);
    return NextResponse.json(manga);
  } catch {
    return NextResponse.json(null);
  }
}
