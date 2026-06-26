"use client";

import { useEffect, useState } from "react";
import { Activity } from "lucide-react";

interface Trade {
  id: string;
  type: "buy" | "sell";
  priceUsd: number;
  amount: number;
  time: string;
}

export function LiveTrades({ mint }: { mint: string }) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrades() {
      try {
        const apiKey = process.env.NEXT_PUBLIC_BIRDEYE_API_KEY;
        if (!apiKey) {
          setTrades([
            { id: "1", type: "buy", priceUsd: 0.14, amount: 2500, time: "10s ago" },
            { id: "2", type: "sell", priceUsd: 0.14, amount: 100, time: "45s ago" },
            { id: "3", type: "buy", priceUsd: 0.138, amount: 5000, time: "1m ago" },
          ]);
          setLoading(false);
          return;
        }

        // Mocking real-time updates for now
        setTrades([
          { id: "1", type: "buy", priceUsd: 0.14, amount: 2500, time: "10s ago" },
          { id: "2", type: "sell", priceUsd: 0.14, amount: 100, time: "45s ago" },
          { id: "3", type: "buy", priceUsd: 0.138, amount: 5000, time: "1m ago" },
        ]);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    }
    fetchTrades();
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
          {trades.map((trade) => (
            <div key={trade.id} className="flex justify-between items-center text-sm border-b border-white/5 pb-2 last:border-0 last:pb-0">
              <span className={`font-bold ${trade.type === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                {trade.type.toUpperCase()}
              </span>
              <div className="text-zinc-300 font-mono text-xs">{trade.time}</div>
              <div className="text-right">
                <div className="font-bold text-white">${(trade.priceUsd * trade.amount).toFixed(2)}</div>
                <div className="text-xs text-zinc-500">{trade.amount.toLocaleString()} Tokens</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
