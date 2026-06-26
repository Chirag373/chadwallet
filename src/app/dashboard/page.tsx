"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { getSolanaAddress } from "@/lib/solana-wallet";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { supabase } from "@/lib/supabase";
import {
  Activity,
  ArrowRight,
  Bell,
  ChartCandlestick,
  LayoutDashboard,
  LogIn,
  Search,
  Settings,
  ShieldCheck,
  Wallet,
} from "lucide-react";

import { Navbar } from "@/components/Navbar";

function shortenAccount(value: string) {
  if (value.length <= 28) return value;
  const [name, domain] = value.split("@");
  if (domain) return `${name.slice(0, 14)}...@${domain}`;
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

const actions = [
  { label: "Explore Markets", icon: Search, href: "/trade/So11111111111111111111111111111111111111112" },
  { label: "Open Chart", icon: ChartCandlestick, href: "/trade/5b23yjBjd1G7gs7TckSEjcVftVNnCwqi9ayTYsVxNCzF" },
];

export default function DashboardPage() {
  const { authenticated, login, user, linkWallet } = usePrivy();
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [openPositions, setOpenPositions] = useState(0);
  const [recentTrades, setRecentTrades] = useState(0);

  const solanaAddress = user ? getSolanaAddress(user) : null;

  const accountLabel = useMemo(() => {
    const email = user?.email?.address || user?.google?.email || user?.apple?.email;
    return shortenAccount(solanaAddress || email || "Not connected");
  }, [user, solanaAddress]);

  useEffect(() => {
    async function fetchBalance() {
      if (!user?.wallet?.address) {
        setSolBalance(0);
        return;
      }
      if (user.wallet.address.startsWith("0x")) {
        setSolBalance(0);
        return;
      }
      try {
        const rpcUrl = process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL || "https://api.mainnet-beta.solana.com";
        const connection = new Connection(rpcUrl);
        const pubkey = new PublicKey(user.wallet.address);
        const balance = await connection.getBalance(pubkey);
        setSolBalance(balance / LAMPORTS_PER_SOL);
      } catch (err) {
        console.error("Failed to fetch balance", err);
      }
    }
    fetchBalance();
  }, [user?.wallet?.address]);

  // Fetch open positions and trade count from Supabase
  useEffect(() => {
    async function fetchSupabaseData() {
      if (!user?.id) {
        setOpenPositions(0);
        setRecentTrades(0);
        return;
      }
      try {
        // First resolve the Supabase UUID from privy_id
        const { data: dbUser } = await supabase
          .from("users")
          .select("id")
          .eq("privy_id", user.id)
          .single();

        if (!dbUser) return;

        // Count positions with balance > 0
        const { data: positions } = await supabase
          .from("positions")
          .select("id")
          .eq("user_id", dbUser.id)
          .gt("balance", 0);
        setOpenPositions(positions?.length ?? 0);

        // Count recent trades (last 7 days)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const { count } = await supabase
          .from("trades")
          .select("id", { count: "exact", head: true })
          .eq("user_id", dbUser.id)
          .gte("created_at", weekAgo.toISOString());
        setRecentTrades(count ?? 0);
      } catch (err) {
        console.error("Failed to fetch Supabase data", err);
      }
    }
    fetchSupabaseData();
  }, [user?.id]);

  return (
    <main className="min-h-screen text-white" style={{ background: "var(--bg-primary)" }}>
      <Navbar />

      <section className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 pb-10 pt-24 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-accent-primary">
              <Settings className="h-4 w-4" aria-hidden="true" />
              Manage Account
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-5xl">Account Settings</h1>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-6" style={{ color: "var(--text-secondary)" }}>
              Manage your linked wallets, security settings, and track your active trading portfolio.
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
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-primary/20 text-accent-primary">
                  <Wallet className="h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest opacity-50">Account</div>
                  <div className="mt-1 text-lg font-black">{accountLabel}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-sm font-bold text-emerald-300">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  {authenticated ? "Connected" : "Login required"}
                </div>
                {authenticated && !solanaAddress && (
                  <button
                    type="button"
                    onClick={() => linkWallet({ walletChainType: 'solana-only' })}
                    className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm font-bold text-white transition-colors hover:bg-white/10"
                  >
                    <Wallet className="h-4 w-4" aria-hidden="true" />
                    Connect Solana
                  </button>
                )}
                {authenticated && solanaAddress && (
                  <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-sm font-bold text-emerald-300">
                    <Wallet className="h-4 w-4" aria-hidden="true" />
                    Wallet Linked
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
                <div className="text-xs font-bold uppercase tracking-widest opacity-50">Portfolio (SOL)</div>
                <div className="mt-2 text-2xl font-black">
                  {solBalance !== null ? `${solBalance.toLocaleString("en-US", { maximumFractionDigits: 4 })} SOL` : "..."}
                </div>
              </div>
              <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
                <div className="text-xs font-bold uppercase tracking-widest opacity-50">Open Positions</div>
                <div className="mt-2 text-2xl font-black">{openPositions}</div>
              </div>
              <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
                <div className="text-xs font-bold uppercase tracking-widest opacity-50">Trades (7d)</div>
                <div className="mt-2 flex items-center gap-2 text-2xl font-black">
                  <Bell className="h-5 w-5 text-accent-primary" aria-hidden="true" />
                  {recentTrades}
                </div>
              </div>
            </div>
          </section>

          <section className="glass-card rounded-[24px] border border-white/5 p-5 shadow-xl">
            <h2 className="text-lg font-black tracking-tight">Quick actions</h2>
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

        <section className="mt-6 glass-card rounded-[24px] border border-white/5 p-5 shadow-xl">
          <h2 className="text-lg font-black tracking-tight">Recent Activity</h2>
          <div className="mt-8 flex flex-col items-center justify-center py-16 opacity-50">
            <Activity className="h-10 w-10 text-zinc-500 mb-4" aria-hidden="true" />
            <p className="text-sm font-bold text-white">No recent transactions found</p>
            <p className="text-xs mt-1 text-zinc-400">Your latest trades and transfers will appear here.</p>
          </div>
        </section>

      </section>
    </main>
  );
}
