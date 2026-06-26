"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";

import { getTokenHolders, getTokenOverview } from "@/lib/birdeye";

interface Holder {
  owner: string;
  amount: number;
  percentage: number;
}

function shortenAddress(addr: string) {
  if (addr.length < 10) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

export function HoldersList({ mint }: { mint: string }) {
  const [holders, setHolders] = useState<Holder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHolders() {
      try {
        const [holdersData, overview] = await Promise.all([
          getTokenHolders(mint, 10),
          getTokenOverview(mint),
        ]);

        if (holdersData && holdersData.length > 0) {
          const totalSupply = overview?.supply || 1; // Avoid div by 0

          const formatted = holdersData.map((h) => ({
            owner: shortenAddress(h.owner),
            amount: h.ui_amount,
            percentage: (h.ui_amount / totalSupply) * 100,
          }));
          setHolders(formatted);
        }
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    }
    fetchHolders();
  }, [mint]);

  return (
    <div className="glass-card rounded-[24px] border border-white/5 p-5 shadow-2xl">
      <div className="mb-4 flex items-center gap-2 text-white font-bold text-lg">
        <Users className="w-5 h-5 text-accent-primary" />
        Top Holders
      </div>
      {loading ? (
        <div className="animate-pulse flex flex-col gap-3">
          <div className="h-4 bg-white/10 rounded w-full"></div>
          <div className="h-4 bg-white/10 rounded w-5/6"></div>
        </div>
      ) : (
        <div className="space-y-3">
          {holders.map((holder, i) => (
            <div key={i} className="flex justify-between items-center text-sm border-b border-white/5 pb-2 last:border-0 last:pb-0">
              <span className="font-mono text-zinc-300">{holder.owner}</span>
              <div className="text-right">
                <div className="font-bold text-white">{holder.percentage.toFixed(2)}%</div>
                <div className="text-xs text-zinc-500">{holder.amount.toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
