import { NextRequest, NextResponse } from "next/server";
import { getComickChapterPages } from "@/lib/comick";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ hid: string }> }
) {
  const { hid } = await params;
  try {
    const pages = await getComickChapterPages(hid);
    return NextResponse.json({ pages: pages.map((p) => p.url), total: pages.length });
  } catch (error) {
    console.error("ComicK chapter pages error:", error);
    return NextResponse.json({ pages: [], total: 0 });
  }
}
