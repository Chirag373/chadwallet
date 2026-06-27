"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface TokenData {
  symbol: string;
  price: string;
  change: string;
  up: boolean;
  mint: string;
}

interface TrendingToken {
  address: string;
  symbol: string;
  price?: number;
  price24hChangePercent?: number;
}

const FALLBACK_TOKENS: TokenData[] = [
  { symbol: "SOL",    price: "$148.30", change: "+4.2%",  up: true,  mint: "So11111111111111111111111111111111111111112" },
  { symbol: "BONK",   price: "$0.000021", change: "+11.8%", up: true,  mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263" },
  { symbol: "WIF",    price: "$2.38",  change: "-1.9%",  up: false, mint: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm" },
  { symbol: "POPCAT", price: "$0.47",  change: "+32.1%", up: true,  mint: "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr" },
  { symbol: "BOME",   price: "$0.013", change: "+2.4%",  up: true,  mint: "ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82" },
  { symbol: "FARTCOIN", price: "$0.22", change: "+18.5%", up: true, mint: "9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump" },
  { symbol: "TRUMP",  price: "$8.40",  change: "+7.6%",  up: true,  mint: "6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN" },
  { symbol: "PNUT",   price: "$0.53",  change: "-3.2%",  up: false, mint: "2qEHjDLDLbuBgRYvsxhc5D6uDWAivNFZGan56P1tpump" },
  { symbol: "MOODENG", price: "$0.11", change: "+22.3%", up: true,  mint: "ED5nyyWEzpPPiWimP8vYm7sD7TD3LAt3Q3gRTWHzc8eu" },
];

function TokenPill({ token, onClick }: { token: TokenData; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 px-4 py-2 rounded-full cursor-pointer shrink-0 transition-colors"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)"; }}
    >
      <div
        className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
        style={{ background: token.up ? "rgba(52,211,153,0.15)" : "rgba(239,68,68,0.15)", color: token.up ? "#34d399" : "#f87171" }}
      >
        {Array.from(token.symbol)[0] || "?"}
      </div>
      <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{token.symbol}</span>
      <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{token.price}</span>
      <span className="text-xs font-semibold" style={{ color: token.up ? "#34d399" : "#f87171" }}>{token.change}</span>
    </button>
  );
}

export function RotatingBanner({ direction = "left" }: { direction?: "left" | "right" }) {
  const router = useRouter();
  const [tokens, setTokens] = useState<TokenData[]>(FALLBACK_TOKENS);

  useEffect(() => {
    async function fetchTrending() {
      try {
        const res = await fetch("/api/trending", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { tokens?: TrendingToken[] };
        if (data.tokens) {
          const formatted = data.tokens.map((token) => {
            const price = Number(token.price) || 0;
            const priceStr = price >= 1
              ? `$${price.toLocaleString("en-US", { maximumFractionDigits: 2 })}`
              : `$${price.toLocaleString("en-US", { maximumSignificantDigits: 4 })}`;
            const changeNum = Number(token.price24hChangePercent) || 0;
            return {
              symbol: token.symbol || "UNKNOWN",
              price: priceStr,
              change: `${changeNum > 0 ? "+" : ""}${changeNum.toFixed(1)}%`,
              up: changeNum >= 0,
              mint: token.address,
            };
          });
          if (formatted.length > 5) {
            setTokens(formatted.slice(0, 12));
          }
        }
      } catch (err) {
        console.error("Failed to fetch trending tokens for banner:", err);
      }
    }
    fetchTrending();
  }, []);

  // Duplicate for seamless loop
  const doubled = [...tokens, ...tokens];

  return (
    <div
      className="w-full overflow-hidden py-2.5 border-b"
      style={{ borderColor: "var(--border-subtle)", background: "rgba(6,5,16,0.8)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="ticker-track gap-3"
        style={{
          animation: direction === "left"
            ? "marquee 30s linear infinite"
            : "marquee-reverse 30s linear infinite",
        }}
      >
        {doubled.map((token, i) => (
          <TokenPill key={`${token.mint}-${i}`} token={token} onClick={() => router.push(`/trade/${token.mint}`)} />
        ))}
      </div>
    </div>
  );
}
