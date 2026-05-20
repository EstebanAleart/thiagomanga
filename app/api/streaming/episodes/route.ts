import { NextRequest, NextResponse } from "next/server";
import { getAnimeEpisodes } from "@/lib/consumet";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json(null, { status: 400 });

  try {
    const data = await getAnimeEpisodes(id);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Streaming episodes error:", error);
    return NextResponse.json(null, { status: 500 });
  }
}
