import { NextRequest, NextResponse } from "next/server";
import { getAnimeRecommendations } from "@/lib/jikan";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const recs = await getAnimeRecommendations(parseInt(id));
    return NextResponse.json(recs);
  } catch (error) {
    console.error("Jikan recommendations error:", error);
    return NextResponse.json([]);
  }
}
