import { NextRequest, NextResponse } from "next/server";
import { getChapterPages, getPageUrl } from "@/lib/mangadex";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const quality = request.nextUrl.searchParams.get("quality") || "dataSaver";

  try {
    const pagesData = await getChapterPages(id);
    
    const preferred = quality === "data" ? pagesData.data : pagesData.dataSaver;
    const pageList = preferred.length > 0 ? preferred : pagesData.data;
    const resolvedQuality = pageList === pagesData.data ? "data" : (quality as "data" | "dataSaver");
    const pages = pageList.map((fileName) =>
      getPageUrl(pagesData.baseUrl, pagesData.hash, fileName, resolvedQuality)
    );

    return NextResponse.json({ pages, total: pages.length });
  } catch (error) {
    console.error("Error fetching chapter pages:", error);
    return NextResponse.json(
      { error: "Failed to fetch chapter pages" },
      { status: 500 }
    );
  }
}
