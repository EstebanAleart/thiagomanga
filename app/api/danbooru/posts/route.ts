import { NextRequest, NextResponse } from "next/server";
import { searchPosts } from "@/lib/danbooru";

export async function GET(request: NextRequest) {
  const tags = request.nextUrl.searchParams.get("tags") || "";
  const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
  const limit = parseInt(request.nextUrl.searchParams.get("limit") || "24");

  try {
    const posts = await searchPosts(tags, page, limit);
    return NextResponse.json(posts);
  } catch (error) {
    console.error("Danbooru posts error:", error);
    return NextResponse.json([]);
  }
}
