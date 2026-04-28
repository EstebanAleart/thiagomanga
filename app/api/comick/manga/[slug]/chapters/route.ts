import { NextRequest, NextResponse } from "next/server";
import { getComickChapters } from "@/lib/comick";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
  const lang = request.nextUrl.searchParams.get("lang") || "en";

  try {
    const data = await getComickChapters(slug, page, lang);
    return NextResponse.json(data);
  } catch (error) {
    console.error("ComicK chapters error:", error);
    return NextResponse.json({ chapters: [], total: 0 });
  }
}
