import { NextRequest, NextResponse } from "next/server";
import { searchManga, getPopularManga, type SearchFilters } from "@/lib/mangadex";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = parseInt(searchParams.get("offset") || "0");
  
  const filters: SearchFilters = {};
  
  const demographic = searchParams.get("demographic");
  if (demographic) filters.demographic = demographic;
  
  const status = searchParams.get("status");
  if (status) filters.status = status;
  
  const orderBy = searchParams.get("orderBy");
  if (orderBy) filters.orderBy = orderBy;
  
  const tags = searchParams.getAll("tags");
  if (tags.length > 0) filters.tags = tags;

  try {
    if (query) {
      const results = await searchManga(query, limit, offset, filters);
      return NextResponse.json(results);
    } else {
      const results = await getPopularManga(limit, filters, offset);
      return NextResponse.json(results);
    }
  } catch (error) {
    console.error("Error fetching manga:", error);
    return NextResponse.json(
      { error: "Failed to fetch manga" },
      { status: 500 }
    );
  }
}
