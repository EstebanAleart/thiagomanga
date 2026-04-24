import { NextRequest, NextResponse } from "next/server";
import { getMangaChapters } from "@/lib/mangadex";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;
  const offset = parseInt(searchParams.get("offset") || "0");
  const fetchAll = searchParams.get("all") === "true";

  try {
    if (fetchAll) {
      // Fetch all chapters paginating through MangaDex API
      const allChapters: any[] = [];
      let currentOffset = 0;
      const pageSize = 500;
      let total = 0;

      do {
        const result = await getMangaChapters(id, pageSize, currentOffset);
        allChapters.push(...result.data);
        total = result.total;
        currentOffset += pageSize;
      } while (currentOffset < total);

      return NextResponse.json({ data: allChapters, total: allChapters.length });
    } else {
      const limit = parseInt(searchParams.get("limit") || "100");
      const chapters = await getMangaChapters(id, limit, offset);
      return NextResponse.json(chapters);
    }
  } catch (error) {
    console.error("Error fetching chapters:", error);
    return NextResponse.json(
      { error: "Failed to fetch chapters" },
      { status: 500 }
    );
  }
}
