export interface BirdeyeToken {
  address: string;
  decimals: number;
  symbol: string;
  name: string;
  marketcap: number;
  fdv: number;
  logoURI: string;
  price: number;
  volume24hUSD: number;
  volume24hChangePercent?: number;
  price24hChangePercent?: number;
}

export interface BirdeyeTokenOverview extends BirdeyeToken {
  marketCap?: number;
  priceChange24hPercent: number;
  v24h: number;
  mc: number;
}

export interface SearchResult {
  address: string;
  symbol: string;
  name: string;
  logoURI: string | null;
  volume24hUSD: number;
  price?: number;
  priceChange24hPercent?: number;
  verified?: boolean;
}

type BirdeyeSearchToken = {
  address?: string;
  symbol?: string;
  name?: string;
  network?: string;
  logoURI?: string | null;
  logo_uri?: string | null;
  volume24hUSD?: number;
  volume_24h_usd?: number;
  v24hUSD?: number;
  price?: number;
  priceChange24hPercent?: number;
  price_change_24h_percent?: number;
  verified?: boolean;
};

export interface OHLCV {
  address: string;
  o: number; // Open
  h: number; // High
  l: number; // Low
  c: number; // Close
  v: number; // Volume
  type: string;
  unixTime: number;
}

// Map of chart interval to how far back to fetch (in seconds)
export const CHART_INTERVALS: Record<string, { type: string; label: string; lookback: number }> = {
  "15m":  { type: "15m",  label: "15m",  lookback: 900 * 200 },     // ~2 days
  "1H":   { type: "1H",   label: "1H",   lookback: 3600 * 200 },    // ~8 days
  "4H":   { type: "4H",   label: "4H",   lookback: 14400 * 200 },   // ~33 days
  "1D":   { type: "1D",   label: "1D",   lookback: 86400 * 200 },   // ~200 days
  "1W":   { type: "1W",   label: "1W",   lookback: 604800 * 100 },  // ~2 years
};

const BIRDEYE_API_KEY = process.env.NEXT_PUBLIC_BIRDEYE_API_KEY || "";
const HEADERS = {
  "X-API-KEY": BIRDEYE_API_KEY,
  "x-chain": "solana",
  "accept": "application/json",
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type BirdeyeResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

function isRateLimited<T>(json: BirdeyeResponse<T>) {
  return json.success === false && String(json.message || "").toLowerCase().includes("too many");
}

async function fetchBirdeyeJson<T>(url: string, options: RequestInit = {}, attempts = 3): Promise<BirdeyeResponse<T>> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...HEADERS,
        ...(options.headers || {}),
      },
    });
    const json = (await res.json()) as BirdeyeResponse<T>;
    if (res.status !== 429 && !isRateLimited(json)) return json;
    if (attempt === attempts - 1) return json;
    await sleep(500 * (attempt + 1));
  }
  return {};
}

export function normalizeSearchToken(value: unknown): SearchResult | null {
  if (!value || typeof value !== "object") return null;
  const token = value as BirdeyeSearchToken;
  if (!token.address || !token.symbol) return null;
  if (token.network && token.network.toLowerCase() !== "solana") return null;

  return {
    address: token.address,
    symbol: token.symbol,
    name: token.name || token.symbol,
    logoURI: token.logoURI || token.logo_uri || null,
    volume24hUSD: token.volume24hUSD ?? token.volume_24h_usd ?? token.v24hUSD ?? 0,
    price: token.price,
    priceChange24hPercent: token.priceChange24hPercent ?? token.price_change_24h_percent,
    verified: token.verified,
  };
}

export async function getTrendingTokens(): Promise<BirdeyeToken[]> {
  try {
    const json = await fetchBirdeyeJson<{ tokens?: BirdeyeToken[] }>("https://public-api.birdeye.so/defi/token_trending", {
      next: { revalidate: 60 },
    });
    if (!json.success || !json.data?.tokens) return [];
    return json.data.tokens;
  } catch (err) {
    console.error("Error fetching trending tokens:", err);
    return [];
  }
}

export async function getTokenOverview(address: string): Promise<BirdeyeTokenOverview | null> {
  try {
    const json = await fetchBirdeyeJson<BirdeyeTokenOverview>(`https://public-api.birdeye.so/defi/token_overview?address=${address}`, {
      next: { revalidate: 30 },
    });
    if (!json.success || !json.data) return null;
    return json.data as BirdeyeTokenOverview;
  } catch (err) {
    console.error("Error fetching token overview:", err);
    return null;
  }
}

export async function getTokenOHLCV(address: string, type: string = "15m"): Promise<OHLCV[]> {
  try {
    const interval = CHART_INTERVALS[type] || CHART_INTERVALS["15m"];
    const timeTo = Math.floor(Date.now() / 1000);
    const timeFrom = timeTo - interval.lookback;

    const json = await fetchBirdeyeJson<{ items?: OHLCV[] }>(
      `https://public-api.birdeye.so/defi/ohlcv?address=${address}&type=${interval.type}&time_from=${timeFrom}&time_to=${timeTo}`,
      {
        cache: "no-store",
      }
    );
    if (!json.success || !json.data?.items) return [];
    return json.data.items;
  } catch (err) {
    console.error("Error fetching OHLCV:", err);
    return [];
  }
}

export interface BirdeyeTrade {
  quote: { symbol: string; amount: string; uiAmount: number };
  base: { symbol: string; amount: string; uiAmount: number };
  basePrice: number;
  quotePrice: number;
  txHash: string;
  source: string;
  blockUnixTime: number;
  txType: "swap" | string;
  owner: string;
  side: "buy" | "sell";
}

export async function getTokenTrades(address: string, limit: number = 20): Promise<BirdeyeTrade[]> {
  try {
    const json = await fetchBirdeyeJson<{ items?: BirdeyeTrade[] }>(
      `https://public-api.birdeye.so/defi/txs/token?address=${address}&offset=0&limit=${limit}&tx_type=swap`,
      { cache: "no-store" }
    );
    if (!json.success || !json.data?.items) return [];
    return json.data.items;
  } catch (err) {
    console.error("Error fetching trades:", err);
    return [];
  }
}

export interface BirdeyeHolder {
  amount: string;
  decimals: number;
  mint: string;
  owner: string;
  token_account: string;
  ui_amount: number;
}

export async function getTokenHolders(address: string, limit: number = 20): Promise<BirdeyeHolder[]> {
  try {
    const json = await fetchBirdeyeJson<{ items?: BirdeyeHolder[] }>(
      `https://public-api.birdeye.so/defi/v3/token/holder?address=${address}&offset=0&limit=${limit}`,
      { next: { revalidate: 60 } }
    );
    if (!json.success || !json.data?.items) return [];
    return json.data.items;
  } catch (err) {
    console.error("Error fetching holders:", err);
    return [];
  }
}
