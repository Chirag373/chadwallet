import { Navbar } from "@/components/Navbar";
import { getTrendingTokens, getTokenOverview, getTokenOHLCV } from "@/lib/birdeye";
import { ChartSection } from "@/components/ChartSection";
import { TokenAvatar } from "@/components/TokenAvatar";
import { TradePanel } from "@/components/TradePanel";
import { LiveTrades } from "@/components/LiveTrades";
import { HoldersList } from "@/components/HoldersList";
import Link from "next/link";

export default async function TradePage({ params }: { params: Promise<{ address: string }> }) {
  const resolvedParams = await params;
  const address = resolvedParams.address;

  const [trendingTokens, tokenOverview] = await Promise.all([
    getTrendingTokens(),
    getTokenOverview(address),
  ]);
  const ohlcvData = await getTokenOHLCV(address, "15m");

  const formatPrice = (price: number | undefined | null) => {
    if (price === null || price === undefined || price === 0) return "$0.00";
    if (price >= 1) return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (price >= 0.01) return `$${price.toFixed(4)}`;
    // For micro-prices like 0.00000874, show as $0.0₅8741
    const str = price.toFixed(20);
    const match = str.match(/^0\.(0+)/);
    if (match) {
      const zeroCount = match[1].length;
      const significantDigits = price.toFixed(zeroCount + 4).slice(zeroCount + 2);
      const subscriptDigits = "₀₁₂₃₄₅₆₇₈₉";
      const sub = String(zeroCount).split("").map(d => subscriptDigits[parseInt(d)]).join("");
      return `$0.0${sub}${significantDigits}`;
    }
    return `$${price.toFixed(6)}`;
  };

  const formatNumber = (num: number | undefined | null) => {
    if (!num) return "0";
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toLocaleString();
  };

  const isPositive = (val: number | undefined | null) => (val || 0) >= 0;

  return (
    <main className="min-h-screen text-white flex flex-col" style={{ background: "var(--bg-primary)" }}>
      <Navbar />
      
      <div className="flex-1 mt-[72px] p-4 flex flex-col lg:flex-row gap-4 min-h-[calc(100vh-72px)] lg:h-[calc(100vh-72px)]">
        {/* Left Panel: Trending Tokens */}
        <aside className="w-[320px] rounded-[24px] border border-white/5 p-4 flex-col hidden lg:flex glass-card shadow-2xl">
          <h2 className="font-bold text-lg mb-4 tracking-tight px-2" style={{ color: "var(--text-primary)" }}>🔥 Trending</h2>
          <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar pr-2">
            {trendingTokens.map((t) => (
              <Link 
                href={`/trade/${t.address}`} 
                key={t.address} 
                className={`flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 cursor-pointer transition-colors ${t.address === address ? 'bg-white/10' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <TokenAvatar src={t.logoURI} symbol={t.symbol} alt={t.symbol} size={32} />
                  <div>
                    <div className="font-bold text-sm tracking-tight">{t.symbol}</div>
                    <div className="text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>Vol: ${formatNumber(t.volume24hUSD)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-sm">{formatPrice(t.price)}</div>
                  {t.price24hChangePercent != null ? (
                    <div className={`text-xs font-bold ${isPositive(t.price24hChangePercent) ? "text-green-400" : "text-red-400"}`}>
                      {isPositive(t.price24hChangePercent) ? "+" : ""}{t.price24hChangePercent.toFixed(2)}%
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-500">—</div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </aside>

        {/* Middle Panel: Chart & Info */}
        <div className="w-full flex-1 flex flex-col gap-4 min-w-0 min-h-[560px] lg:min-h-0">
          <div className="glass-card rounded-[24px] border border-white/5 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-4 min-w-0">
              <TokenAvatar
                src={tokenOverview?.logoURI}
                symbol={tokenOverview?.symbol}
                alt={tokenOverview?.symbol || "Token"}
                size={56}
                className="border-2 border-white/10"
              />
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex flex-wrap items-end gap-x-2">
                  {tokenOverview?.symbol || "Unknown"}
                  <span className="text-sm font-medium opacity-50 pb-1 truncate max-w-full">{tokenOverview?.name}</span>
                </h1>
                <div className="text-sm font-mono opacity-60 flex flex-wrap items-center gap-2">
                  {address.slice(0,6)}...{address.slice(-4)}
                  <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] uppercase tracking-wider">Solana</span>
                </div>
              </div>
            </div>
            <div className="text-left sm:text-right flex items-end justify-between sm:justify-end gap-4">
               <div className="flex flex-col items-start sm:items-end">
                 <span className="text-xs uppercase tracking-widest font-bold opacity-50 mb-1">Market Cap</span>
                 <span className="font-mono text-sm font-bold">${formatNumber(tokenOverview?.mc ?? tokenOverview?.marketCap)}</span>
               </div>
               <div className="flex flex-col items-end pl-4 border-l border-white/10 min-w-0">
                 <div className="text-3xl sm:text-4xl font-black tracking-tighter">
                   {formatPrice(tokenOverview?.price)}
                 </div>
                 <div className={`text-sm font-bold ${isPositive(tokenOverview?.priceChange24hPercent) ? "text-green-400" : "text-red-400"}`}>
                   {isPositive(tokenOverview?.priceChange24hPercent) ? "+" : ""}{(tokenOverview?.priceChange24hPercent || 0).toFixed(2)}% (24h)
                 </div>
               </div>
            </div>
          </div>
          
          <ChartSection key={address} address={address} initialData={ohlcvData} />
        </div>

        {/* Right Panel: Buy/Sell */}
        <aside className="w-full lg:w-[360px] flex shrink-0 flex-col gap-4 overflow-y-auto custom-scrollbar pr-2 pb-4">
          <TradePanel
            tokenAddress={address}
            tokenSymbol={tokenOverview?.symbol}
            tokenName={tokenOverview?.name}
            tokenPrice={tokenOverview?.price}
          />
          <LiveTrades mint={address} />
          <HoldersList mint={address} />
        </aside>
      </div>
    </main>
  );
}
