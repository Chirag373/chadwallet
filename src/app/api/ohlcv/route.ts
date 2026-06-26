import { NextRequest, NextResponse } from "next/server";
import { CHART_INTERVALS, getTokenOHLCV } from "@/lib/birdeye";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");
  const interval = searchParams.get("interval") || "15m";

  if (!address) {
    return NextResponse.json({ data: [], error: "Missing token address" }, { status: 400 });
  }

  if (!CHART_INTERVALS[interval]) {
    return NextResponse.json({ data: [], error: "Unsupported chart interval" }, { status: 400 });
  }

  const data = await getTokenOHLCV(address, interval);
  return NextResponse.json({ data });
}
