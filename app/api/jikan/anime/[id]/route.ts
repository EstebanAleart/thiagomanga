import { NextRequest, NextResponse } from "next/server";
import { getAnimeById } from "@/lib/jikan";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const anime = await getAnimeById(parseInt(id));
    if (!anime) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(anime);
  } catch (error) {
    console.error("Jikan anime detail error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
