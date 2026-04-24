import { NextRequest, NextResponse } from "next/server";
import { fetchANNDetails } from "@/lib/ann";

export async function GET(request: NextRequest) {
  const idParam = request.nextUrl.searchParams.get("id") || "";
  const type = (request.nextUrl.searchParams.get("type") || "title") as "anime" | "manga" | "title";

  if (!idParam) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  try {
    const ids = idParam.split(",").map(Number).filter(Boolean);
    const details = await fetchANNDetails(ids, type);
    if (details.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(details[0]);
  } catch (error) {
    console.error("ANN details error:", error);
    return NextResponse.json({ error: "Failed to fetch details" }, { status: 500 });
  }
}
