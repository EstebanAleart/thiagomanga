import { NextRequest, NextResponse } from "next/server";
import { getPool, getPoolPosts } from "@/lib/danbooru";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const pool = await getPool(parseInt(id));
    if (!pool) return NextResponse.json({ error: "Pool not found" }, { status: 404 });

    const posts = await getPoolPosts(pool);
    return NextResponse.json({ pool, posts });
  } catch (error) {
    console.error("Danbooru pool error:", error);
    return NextResponse.json({ error: "Failed to fetch pool" }, { status: 500 });
  }
}
