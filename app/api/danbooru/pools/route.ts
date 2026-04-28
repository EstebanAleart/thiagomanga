import { NextRequest, NextResponse } from "next/server";
import { searchPools } from "@/lib/danbooru";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") || "";
  const page = parseInt(request.nextUrl.searchParams.get("page") || "1");

  try {
    const pools = await searchPools(query, page);
    return NextResponse.json(pools);
  } catch (error) {
    console.error("Danbooru pools error:", error);
    return NextResponse.json([]);
  }
}
