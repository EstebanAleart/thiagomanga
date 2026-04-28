import { NextRequest, NextResponse } from "next/server";
import { getComickManga } from "@/lib/comick";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const manga = await getComickManga(slug);
    if (!manga) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(manga);
  } catch (error) {
    console.error("ComicK manga error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
