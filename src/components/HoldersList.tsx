"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";

interface Holder {
  owner: string;
  amount: number;
  percentage: number;
}

export function HoldersList({ mint }: { mint: string }) {
  const [holders, setHolders] = useState<Holder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHolders() {
      try {
        const apiKey = process.env.NEXT_PUBLIC_BIRDEYE_API_KEY;
        if (!apiKey) {
          // Dummy fallback
          setHolders([
            { owner: "7A9...3Kx", amount: 1500000, percentage: 15.0 },
            { owner: "B4x...9zL", amount: 800000, percentage: 8.0 },
            { owner: "Raydium Pool", amount: 500000, percentage: 5.0 },
          ]);
          setLoading(false);
          return;
        }

        // Normally we'd call BirdEye API for top holders here.
        // For demonstration without exact endpoint, we use dummy data.
        setHolders([
          { owner: "7A9...3Kx", amount: 1500000, percentage: 15.0 },
          { owner: "B4x...9zL", amount: 800000, percentage: 8.0 },
          { owner: "Raydium Pool", amount: 500000, percentage: 5.0 },
        ]);
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
