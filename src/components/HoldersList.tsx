"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";

import { getTokenHolders, getTokenOverview } from "@/lib/birdeye";

interface Holder {
  id: string;
  owner: string;
  amount: number;
  percentage: number | null;
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
          const totalSupply =
            overview?.circulatingSupply ||
            overview?.realCirculatingSupply ||
            overview?.supply ||
            0;

          const formatted = holdersData.map((h) => ({
            id: h.token_account,
            owner: shortenAddress(h.owner),
            amount: h.ui_amount,
            percentage: totalSupply > 0 ? (h.ui_amount / totalSupply) * 100 : null,
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
          {holders.length === 0 && (
            <div className="py-6 text-center text-sm font-medium text-zinc-500">
              Holder data is unavailable for this token.
            </div>
          )}
          {holders.map((holder, i) => (
            <div key={holder.id || `${holder.owner}-${i}`} className="flex justify-between items-center text-sm border-b border-white/5 pb-2 last:border-0 last:pb-0">
              <span className="font-mono text-zinc-300">{holder.owner}</span>
              <div className="text-right">
                <div className="font-bold text-white">
                  {holder.percentage === null ? "--" : `${holder.percentage.toFixed(2)}%`}
                </div>
                <div className="text-xs text-zinc-500">{holder.amount.toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
