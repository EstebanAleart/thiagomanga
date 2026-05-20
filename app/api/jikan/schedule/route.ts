import { NextRequest, NextResponse } from "next/server";
import { getAnimeSchedule } from "@/lib/jikan";

type Day = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export async function GET(request: NextRequest) {
  const day = request.nextUrl.searchParams.get("day") as Day | null;
  try {
    const data = await getAnimeSchedule(day || undefined);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Jikan schedule error:", error);
    return NextResponse.json({ data: [] });
  }
}
