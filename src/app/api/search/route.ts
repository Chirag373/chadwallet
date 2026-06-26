import { NextRequest, NextResponse } from "next/server";
import { normalizeSearchToken } from "@/lib/birdeye";
import type { SearchResult } from "@/lib/birdeye";

export const dynamic = "force-dynamic";

const BIRDEYE_HEADERS = {
  "X-API-KEY": process.env.NEXT_PUBLIC_BIRDEYE_API_KEY || "",
  "x-chain": "solana",
  accept: "application/json",
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const COMMON_TOKENS: SearchResult[] = [
  {
    address: "So11111111111111111111111111111111111111112",
    symbol: "SOL",
    name: "Wrapped SOL",
    logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
    volume24hUSD: 0,
    verified: true,
  },
  {
    address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    symbol: "USDC",
    name: "USD Coin",
    logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
    volume24hUSD: 0,
    verified: true,
  },
  {
    address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    symbol: "USDT",
    name: "USDT",
    logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg",
    volume24hUSD: 0,
    verified: true,
  },
];

type SearchGroup = {
  type?: string;
  result?: unknown[];
};

type SearchResponse = {
  message?: string;
  data?: {
    items?: SearchGroup[];
    tokens?: unknown[];
  };
};

async function fetchBirdeyeJson(url: string, attempts = 2): Promise<SearchResponse> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const res = await fetch(url, {
      headers: BIRDEYE_HEADERS,
      cache: "no-store",
    });
    const json = (await res.json()) as SearchResponse;
    const rateLimited = res.status === 429 || String(json?.message || "").toLowerCase().includes("too many");
    if (!rateLimited || attempt === attempts - 1) return json;
    await sleep(400 * (attempt + 1));
  }
  return {};
}

function dedupeTokens(tokens: SearchResult[]) {
  const seen = new Set<string>();
  return tokens.filter((token) => {
    if (seen.has(token.address)) return false;
    seen.add(token.address);
    return true;
  });
}

function searchCommonTokens(keyword: string) {
  const query = keyword.toLowerCase();
  return COMMON_TOKENS.filter((token) => {
    return (
      token.symbol.toLowerCase().includes(query) ||
      token.name.toLowerCase().includes(query) ||
      token.address.toLowerCase() === query
    );
  });
}

async function searchV3(keyword: string) {
  const json = await fetchBirdeyeJson(
    `https://public-api.birdeye.so/defi/v3/search?keyword=${encodeURIComponent(
      keyword
    )}&target=token&sort_by=volume_24h_usd&sort_type=desc&limit=12`
  );
  const rawTokens = json.data?.items?.find((item) => item.type === "token")?.result || [];
  return rawTokens.map(normalizeSearchToken).filter(Boolean) as SearchResult[];
}

async function searchTokenList(keyword: string) {
  const json = await fetchBirdeyeJson(
    "https://public-api.birdeye.so/defi/tokenlist?sort_by=v24hUSD&sort_type=desc&offset=0&limit=80"
  );
  const query = keyword.toLowerCase();
  const rawTokens = json?.data?.tokens || [];

  return (rawTokens.map(normalizeSearchToken).filter(Boolean) as SearchResult[]).filter((token) => {
    return (
      token.symbol.toLowerCase().includes(query) ||
      token.name.toLowerCase().includes(query) ||
      token.address.toLowerCase() === query
    );
  });
}

export async function GET(request: NextRequest) {
  const keyword = request.nextUrl.searchParams.get("keyword") || "";
  if (!keyword.trim()) {
    return NextResponse.json({ results: [] });
  }

  try {
    const v3Results = await searchV3(keyword);
    const fallbackResults = v3Results.length > 0 ? [] : await searchTokenList(keyword);
    const commonResults = v3Results.length + fallbackResults.length > 0 ? [] : searchCommonTokens(keyword);
    return NextResponse.json({ results: dedupeTokens([...v3Results, ...fallbackResults, ...commonResults]).slice(0, 8) });
  } catch (err) {
    console.error("Search error:", err);
    return NextResponse.json({ results: [] });
  }
}
