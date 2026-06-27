import { NextResponse } from "next/server";

import { getTrendingTokens } from "@/lib/birdeye";

export async function GET() {
  const tokens = await getTrendingTokens();
  return NextResponse.json({ tokens: tokens.slice(0, 12) });
}
