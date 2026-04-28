import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL required" }, { status: 400 });
  }

  console.log("[v0] Proxying image:", url);

  try {
    const host = new URL(url).hostname;
    const referer = host.includes("donmai.us")
      ? "https://danbooru.donmai.us/"
      : host.includes("mangadex") || host.includes("uploads.mangadex")
      ? "https://mangadex.org/"
      : `https://${host}/`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: referer,
        Accept: "image/webp,image/apng,image/*,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      console.log("[v0] Image fetch failed:", response.status, response.statusText, url);
      return new NextResponse(`Image fetch failed: ${response.status}`, {
        status: response.status,
      });
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const buffer = await response.arrayBuffer();

    console.log("[v0] Image fetched successfully:", url.substring(0, 60), "size:", buffer.byteLength);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.log("[v0] Image proxy error:", error);
    return new NextResponse(`Proxy error: ${error}`, { status: 500 });
  }
}
