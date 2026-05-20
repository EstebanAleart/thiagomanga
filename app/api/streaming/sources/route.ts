import { NextRequest, NextResponse } from "next/server";
import { getEpisodeSources } from "@/lib/consumet";

export async function GET(request: NextRequest) {
  const episodeId = request.nextUrl.searchParams.get("id");
  if (!episodeId) return NextResponse.json(null, { status: 400 });

  const subOrDub = (request.nextUrl.searchParams.get("type") || "sub") as "sub" | "dub";
  try {
    const data = await getEpisodeSources(episodeId, subOrDub);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Streaming sources error:", error);
    return NextResponse.json(null, { status: 500 });
  }
}
