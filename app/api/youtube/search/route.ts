import { type NextRequest, NextResponse } from "next/server";

const API_KEYS = [
  process.env.YOUTUBE_API_KEY,
  process.env.YOUTUBE_API_KEY_BACKUP,
].filter(Boolean) as string[];

async function searchWithKey(key: string, query: string, pageToken?: string | null) {
  let searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=8&q=${encodeURIComponent(query)}&type=video&videoEmbeddable=true&key=${key}`;
  if (pageToken) searchUrl += `&pageToken=${pageToken}`;

  const searchResponse = await fetch(searchUrl);
  if (!searchResponse.ok) {
    const body = await searchResponse.text();
    throw new Error(`YouTube API error (${searchResponse.status}): ${body}`);
  }

  const searchData = await searchResponse.json();
  const videoIds = searchData.items.map((item: any) => item.id.videoId).join(",");

  const detailsResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&id=${videoIds}&key=${key}`
  );
  const detailsData = detailsResponse.ok ? await detailsResponse.json() : { items: [] };

  const videos = searchData.items.map((item: any) => {
    const details = detailsData.items.find((detail: any) => detail.id === item.id.videoId);
    return {
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.medium.url,
      channelTitle: item.snippet.channelTitle,
      duration: details?.contentDetails?.duration || null,
      viewCount: details?.statistics?.viewCount || null,
    };
  });

  return {
    videos,
    nextPageToken: searchData.nextPageToken || null,
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");
  const pageToken = searchParams.get("pageToken");

  if (!query) {
    return NextResponse.json({ error: "Query parameter is required" }, { status: 400 });
  }

  if (API_KEYS.length === 0) {
    return NextResponse.json({ error: "No YouTube API keys configured" }, { status: 500 });
  }

  let lastError: Error | null = null;

  for (const key of API_KEYS) {
    try {
      const result = await searchWithKey(key, query, pageToken);
      return NextResponse.json(result);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn("YouTube API key failed, trying next...", lastError.message.slice(0, 100));
    }
  }

  console.error("All YouTube API keys exhausted:", lastError?.message);
  return NextResponse.json({ error: "Failed to search YouTube" }, { status: 500 });
}
