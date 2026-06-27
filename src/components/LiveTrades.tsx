"use client";

import { useEffect, useState } from "react";
import { Activity } from "lucide-react";

import { getTokenTrades } from "@/lib/birdeye";

interface Trade {
  id: string;
  type: "buy" | "sell";
  amount: number;
  symbol: string;
  valueUsd: number;
  time: string;
}

function formatTimeAgo(unixMs: number) {
  const seconds = Math.floor((Date.now() - unixMs) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function LiveTrades({ mint }: { mint: string }) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrades() {
      try {
        const data = await getTokenTrades(mint, 15);
        if (data && data.length > 0) {
          const formatted = data.map((trade, index) => {
            const tokenLeg = trade.base.address === mint ? trade.base : trade.quote;
            const tokenPrice =
              tokenLeg.price ||
              tokenLeg.nearestPrice ||
              (trade.base.address === mint ? trade.basePrice : trade.quotePrice) ||
              0;

            return {
              id: `${trade.txHash}-${index}`,
              type: trade.side,
              amount: tokenLeg.uiAmount,
              symbol: tokenLeg.symbol,
              valueUsd: tokenLeg.uiAmount * tokenPrice,
              time: formatTimeAgo(trade.blockUnixTime * 1000),
            };
          });
          setTrades(formatted);
        }
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    }
    fetchTrades();
    const interval = setInterval(fetchTrades, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, [mint]);

  return (
    <div className="glass-card rounded-[24px] border border-white/5 p-5 shadow-2xl">
      <div className="mb-4 flex items-center gap-2 text-white font-bold text-lg">
        <Activity className="w-5 h-5 text-accent-primary" />
        Live Trades
      </div>
      {loading ? (
        <div className="animate-pulse flex flex-col gap-3">
          <div className="h-4 bg-white/10 rounded w-full"></div>
          <div className="h-4 bg-white/10 rounded w-5/6"></div>
        </div>
      ) : (
        <div className="space-y-3">
          {trades.length === 0 && (
            <div className="py-6 text-center text-sm font-medium text-zinc-500">
              No recent swaps were found.
            </div>
          )}
          {trades.map((trade) => (
            <div key={trade.id} className="flex justify-between items-center text-sm border-b border-white/5 pb-2 last:border-0 last:pb-0">
              <span className={`font-bold ${trade.type === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                {trade.type.toUpperCase()}
              </span>
              <div className="text-zinc-300 font-mono text-xs">{trade.time}</div>
              <div className="text-right">
                <div className="font-bold text-white">
                  {trade.valueUsd.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 2,
                  })}
                </div>
                <div className="text-xs text-zinc-500">
                  {trade.amount.toLocaleString("en-US", { maximumFractionDigits: 4 })} {trade.symbol}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
