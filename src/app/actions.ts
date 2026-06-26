"use server";

import { getTokenOHLCV, normalizeSearchToken, OHLCV } from "@/lib/birdeye";
import type { SearchResult } from "@/lib/birdeye";

export async function searchTokens(query: string): Promise<SearchResult[]> {
  try {
    const res = await fetch(
      `https://public-api.birdeye.so/defi/v3/search?keyword=${encodeURIComponent(
        query
      )}&target=token&sort_by=volume_24h_usd&sort_type=desc&limit=5`,
      {
        headers: {
          "X-API-KEY": process.env.NEXT_PUBLIC_BIRDEYE_API_KEY || "",
          "x-chain": "solana",
          accept: "application/json",
        },
        next: { revalidate: 30 },
      }
    );
    const json = await res.json();
    if (json.success && json.data?.items?.[0]?.result) {
      return json.data.items[0].result.map(normalizeSearchToken).filter(Boolean) as SearchResult[];
    }
    return [];
  } catch (err) {
    console.error("Error searching tokens:", err);
    return [];
  }
}

export async function fetchChartData(address: string, interval: string): Promise<OHLCV[]> {
  return getTokenOHLCV(address, interval);
}
