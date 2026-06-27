"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import {
  Activity,
  ArrowRight,
  ChartCandlestick,
  ExternalLink,
  LayoutDashboard,
  LogIn,
  Search,
  ShieldCheck,
  Wallet,
} from "lucide-react";

import { Navbar } from "@/components/Navbar";
import { getSolanaAddress } from "@/lib/solana-wallet";
import { supabase } from "@/lib/supabase";

interface RecentTrade {
  id: string;
  amount_usd: number | string;
  created_at: string;
  token_mint: string;
  token_symbol: string | null;
  tx_signature: string | null;
  type: "buy" | "sell";
}

const actions = [
  {
    label: "Explore markets",
    icon: Search,
    href: "/trade/So11111111111111111111111111111111111111112",
  },
  {
    label: "Open Jotchua chart",
    icon: ChartCandlestick,
    href: "/trade/BcHEaaTCvycPwwsJ9yQTXdHP9X2gCLkznDbZ8VySpump",
  },
];

function shortenAccount(value: string) {
  if (value.length <= 28) return value;
  const [name, domain] = value.split("@");
  if (domain) return `${name.slice(0, 14)}...@${domain}`;
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

function shortenMint(value: string) {
  return `${value.slice(0, 5)}...${value.slice(-4)}`;
}

export default function DashboardPage() {
  const { authenticated, linkWallet, login, user } = usePrivy();
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [openPositions, setOpenPositions] = useState(0);
  const [recentTrades, setRecentTrades] = useState<RecentTrade[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

  const solanaAddress = useMemo(() => getSolanaAddress(user), [user]);
  const userId = user?.id;
  const visibleBalance = solanaAddress ? solBalance : 0;
  const visiblePositions = userId ? openPositions : 0;
  const visibleTrades = userId ? recentTrades : [];
  const accountLabel = useMemo(() => {
    const email = user?.email?.address || user?.google?.email || user?.apple?.email;
    return shortenAccount(email || solanaAddress || "Not connected");
  }, [solanaAddress, user]);

  useEffect(() => {
    if (!solanaAddress) return;

    let cancelled = false;
    async function fetchBalance() {
      try {
        const rpcUrl =
          process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL ||
          "https://api.mainnet-beta.solana.com";
        const connection = new Connection(rpcUrl);
        const lamports = await connection.getBalance(new PublicKey(solanaAddress!));
        if (!cancelled) setSolBalance(lamports / LAMPORTS_PER_SOL);
      } catch (error) {
        console.error("Failed to fetch dashboard balance:", error);
        if (!cancelled) setSolBalance(0);
      }
    }
    void fetchBalance();
    return () => {
      cancelled = true;
    };
  }, [solanaAddress]);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;
    async function fetchDashboardData() {
      setActivityLoading(true);
      try {
        const { data: dbUser, error: userError } = await supabase
          .from("users")
          .select("id")
          .eq("privy_id", userId!)
          .maybeSingle();
        if (userError) throw userError;
        if (!dbUser) {
          if (!cancelled) {
            setOpenPositions(0);
            setRecentTrades([]);
          }
          return;
        }

        const [positionsResponse, tradesResponse] = await Promise.all([
          supabase
            .from("positions")
            .select("id", { count: "exact", head: true })
            .eq("user_id", dbUser.id)
            .gt("balance", 0),
          supabase
            .from("trades")
            .select(
              "id, amount_usd, created_at, token_mint, token_symbol, tx_signature, type",
            )
            .eq("user_id", dbUser.id)
            .order("created_at", { ascending: false })
            .limit(10),
        ]);

        if (positionsResponse.error) throw positionsResponse.error;
        if (tradesResponse.error) throw tradesResponse.error;
        if (!cancelled) {
          setOpenPositions(positionsResponse.count ?? 0);
          setRecentTrades((tradesResponse.data || []) as RecentTrade[]);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard activity:", error);
        if (!cancelled) {
          setOpenPositions(0);
          setRecentTrades([]);
        }
      } finally {
        if (!cancelled) setActivityLoading(false);
      }
    }
    void fetchDashboardData();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return (
    <main className="min-h-screen text-white" style={{ background: "var(--bg-primary)" }}>
      <Navbar />

      <section className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 pb-10 pt-24 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-accent-primary">
              <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
              Portfolio
            </div>
            <h1 className="text-3xl font-black sm:text-5xl">Dashboard</h1>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-zinc-400">
              Review your connected Solana wallet, active positions, and confirmed swaps.
            </p>
          </div>

          {!authenticated && (
            <button
              type="button"
              onClick={login}
              className="btn-primary w-full gap-2 sm:w-fit"
              style={{ padding: "11px 18px", borderRadius: "12px", fontSize: "0.875rem" }}
            >
              <LogIn className="h-4 w-4" aria-hidden="true" />
              Login
            </button>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
          <section className="glass-card rounded-[24px] border border-white/5 p-5 shadow-xl">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent-primary/20 text-accent-primary">
                  <Wallet className="h-6 w-6" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                    Account
                  </div>
                  <div className="mt-1 truncate text-lg font-black">{accountLabel}</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-sm font-bold text-emerald-300">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  {authenticated ? "Authenticated" : "Login required"}
                </div>
                {authenticated && !solanaAddress && (
                  <button
                    type="button"
                    onClick={() => linkWallet({ walletChainType: "solana-only" })}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm font-bold text-white transition-colors hover:bg-white/10"
                  >
                    <Wallet className="h-4 w-4" aria-hidden="true" />
                    Connect Solana
                  </button>
                )}
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
                <div className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                  Wallet balance
                </div>
                <div className="mt-2 text-2xl font-black">
                  {visibleBalance === null
                    ? "..."
                    : `${visibleBalance.toLocaleString("en-US", { maximumFractionDigits: 4 })} SOL`}
                </div>
              </div>
              <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
                <div className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                  Open positions
                </div>
                <div className="mt-2 text-2xl font-black">{visiblePositions}</div>
              </div>
              <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
                <div className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                  Recent swaps
                </div>
                <div className="mt-2 text-2xl font-black">{visibleTrades.length}</div>
              </div>
            </div>
          </section>

          <section className="glass-card rounded-[24px] border border-white/5 p-5 shadow-xl">
            <h2 className="text-lg font-black">Quick actions</h2>
            <div className="mt-4 grid gap-2">
              {actions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3 transition-colors hover:bg-white/[0.07]"
                  >
                    <span className="flex items-center gap-3 text-sm font-bold">
                      <Icon className="h-4 w-4 text-accent-primary" aria-hidden="true" />
                      {action.label}
                    </span>
                    <ArrowRight className="h-4 w-4 text-zinc-500" aria-hidden="true" />
                  </Link>
                );
              })}
            </div>
          </section>
        </div>

        <section className="glass-card mt-2 rounded-[24px] border border-white/5 p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-black">
              <Activity className="h-5 w-5 text-accent-primary" aria-hidden="true" />
              Recent activity
            </h2>
            <span className="text-xs font-bold text-zinc-500">Last 10 swaps</span>
          </div>

          {activityLoading ? (
            <div className="mt-5 space-y-2">
              {[0, 1, 2].map((item) => (
                <div key={item} className="h-16 animate-pulse rounded-xl bg-white/5" />
              ))}
            </div>
          ) : visibleTrades.length > 0 ? (
            <div className="mt-4 divide-y divide-white/5">
              {visibleTrades.map((trade) => (
                <div
                  key={trade.id}
                  className="grid grid-cols-[1fr_auto] items-center gap-4 py-3 sm:grid-cols-[1fr_0.7fr_0.7fr_auto]"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-md px-2 py-1 text-[10px] font-black uppercase ${
                          trade.type === "buy"
                            ? "bg-emerald-400/10 text-emerald-300"
                            : "bg-red-400/10 text-red-300"
                        }`}
                      >
                        {trade.type}
                      </span>
                      <span className="truncate text-sm font-bold">
                        {trade.token_symbol || shortenMint(trade.token_mint)}
                      </span>
                    </div>
                    <div className="mt-1 font-mono text-[11px] text-zinc-600 sm:hidden">
                      {shortenMint(trade.token_mint)}
                    </div>
                  </div>
                  <div className="hidden font-mono text-xs text-zinc-500 sm:block">
                    {shortenMint(trade.token_mint)}
                  </div>
                  <div className="hidden text-right sm:block">
                    <div className="text-sm font-bold">
                      {Number(trade.amount_usd).toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                        maximumFractionDigits: 2,
                      })}
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      {new Date(trade.created_at).toLocaleString()}
                    </div>
                  </div>
                  {trade.tx_signature ? (
                    <a
                      href={`https://solscan.io/tx/${trade.tx_signature}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-white/5 hover:text-white"
                      aria-label="View transaction on Solscan"
                    >
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    </a>
                  ) : (
                    <div className="h-9 w-9" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-8 flex flex-col items-center justify-center py-12 text-center">
              <Activity className="mb-4 h-10 w-10 text-zinc-700" aria-hidden="true" />
              <p className="text-sm font-bold text-white">No confirmed swaps yet</p>
              <p className="mt-1 text-xs text-zinc-500">
                Completed Jupiter swaps will appear here automatically.
              </p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
