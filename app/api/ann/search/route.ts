import { NextRequest, NextResponse } from "next/server";
import { searchANN, fetchANNReports } from "@/lib/ann";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") || "";
  const type = (request.nextUrl.searchParams.get("type") || "anime") as "anime" | "manga";
  const nskip = parseInt(request.nextUrl.searchParams.get("nskip") || "0");
  const nlist = parseInt(request.nextUrl.searchParams.get("nlist") || "50");

  try {
    if (q.length > 0) {
      const results = await searchANN(q, type);
      return NextResponse.json({ data: results, total: results.length });
    } else {
      const results = await fetchANNReports(type, nlist, nskip);
      return NextResponse.json({ data: results, total: results.length });
    }
  } catch (error) {
    console.error("ANN search error:", error);
    return NextResponse.json({ error: "Failed to fetch from ANN" }, { status: 500 });
  }
}
