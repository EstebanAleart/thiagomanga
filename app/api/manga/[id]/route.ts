import { NextRequest, NextResponse } from "next/server";
import { getMangaDetails } from "@/lib/mangadex";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const manga = await getMangaDetails(id);

    if (!manga) {
      return NextResponse.json({ error: "Manga not found" }, { status: 404 });
    }

    return NextResponse.json(manga);
  } catch (error) {
    console.error("Error fetching manga details:", error);
    return NextResponse.json(
      { error: "Failed to fetch manga details" },
      { status: 500 }
    );
  }
}
