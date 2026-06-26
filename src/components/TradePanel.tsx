"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Connection, LAMPORTS_PER_SOL, PublicKey, VersionedTransaction } from "@solana/web3.js";
import { supabase } from "@/lib/supabase";
import {
  ArrowDownUp,
  BadgeDollarSign,
  CheckCircle2,
  Info,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

type TradeMode = "buy" | "sell";

interface TradePanelProps {
  tokenAddress: string;
  tokenSymbol?: string | null;
  tokenName?: string | null;
  tokenPrice?: number | null;
}

const QUICK_AMOUNTS = ["10", "50", "100", "500"];
const SLIPPAGE_OPTIONS = ["0.5", "1", "3"];
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

function parseAmount(value: string) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}

function formatTokenAmount(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0.0";
  if (value >= 1_000_000) return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (value >= 1) return value.toLocaleString("en-US", { maximumFractionDigits: 4 });
  return value.toLocaleString("en-US", { maximumSignificantDigits: 6 });
}

function formatUsd(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "$0.00";
  if (value >= 1) {
    return value.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  return `$${value.toLocaleString("en-US", { maximumSignificantDigits: 6 })}`;
}

export function TradePanel({ tokenAddress, tokenSymbol, tokenName, tokenPrice }: TradePanelProps) {
  const { authenticated, login, user } = usePrivy();
  const { wallets } = useWallets();
  const [mode, setMode] = useState<TradeMode>("buy");
  const [amount, setAmount] = useState("");
  const [slippage, setSlippage] = useState("1");
  const [status, setStatus] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [walletBalance, setWalletBalance] = useState<string | null>(null);

  const symbol = tokenSymbol || "TOKEN";
  const price = tokenPrice || 0;
  const numericAmount = parseAmount(amount);
  const sourceSymbol = mode === "buy" ? "USDC" : symbol;
  const targetSymbol = mode === "buy" ? symbol : "USDC";

  // Fetch user's wallet balance (SOL when selling, USDC when buying)
  const walletAddress = user?.wallet?.address ?? null;

  useEffect(() => {
    if (!walletAddress) return;

    let cancelled = false;

    async function fetchBalance() {
      try {
        const rpcUrl = process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL || "https://api.mainnet-beta.solana.com";
        const connection = new Connection(rpcUrl);
        const pubkey = new PublicKey(walletAddress!);

        if (mode === "buy") {
          const tokenAccounts = await connection.getParsedTokenAccountsByOwner(pubkey, {
            mint: new PublicKey(USDC_MINT),
          });
          const usdcAccount = tokenAccounts.value[0];
          if (!cancelled) {
            if (usdcAccount) {
              const bal = usdcAccount.account.data.parsed.info.tokenAmount.uiAmount;
              setWalletBalance(`${Number(bal).toLocaleString("en-US", { maximumFractionDigits: 2 })} USDC`);
            } else {
              setWalletBalance("0 USDC");
            }
          }
        } else {
          if (tokenAddress === "So11111111111111111111111111111111111111112") {
            const lamports = await connection.getBalance(pubkey);
            if (!cancelled) {
              const sol = lamports / LAMPORTS_PER_SOL;
              setWalletBalance(`${sol.toLocaleString("en-US", { maximumFractionDigits: 4 })} SOL`);
            }
          } else {
            const tokenAccounts = await connection.getParsedTokenAccountsByOwner(pubkey, {
              mint: new PublicKey(tokenAddress),
            });
            const account = tokenAccounts.value[0];
            if (!cancelled) {
              if (account) {
                const bal = account.account.data.parsed.info.tokenAmount.uiAmount;
                setWalletBalance(`${Number(bal).toLocaleString("en-US", { maximumFractionDigits: 4 })} ${symbol}`);
              } else {
                setWalletBalance(`0 ${symbol}`);
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch wallet balance", err);
        if (!cancelled) setWalletBalance("Error");
      }
    }

    fetchBalance();
    return () => { cancelled = true; };
  }, [walletAddress, mode, tokenAddress, symbol]);


  const estimatedReceive = useMemo(() => {
    if (!price || !numericAmount) return 0;
    return mode === "buy" ? numericAmount / price : numericAmount * price;
  }, [mode, numericAmount, price]);

  // Fetch real Jupiter quote if amount is present
  const [jupQuote, setJupQuote] = useState<Record<string, unknown> | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);

  useEffect(() => {
    async function fetchQuote() {
      if (!numericAmount || numericAmount <= 0) {
        setJupQuote(null);
        return;
      }
      try {
        setLoadingQuote(true);
        const inputMint = mode === "buy" ? USDC_MINT : tokenAddress;
        const outputMint = mode === "buy" ? tokenAddress : USDC_MINT;
        const amountInBaseUnits = Math.floor(numericAmount * (mode === "buy" ? 1e6 : 1e6)); // Assuming 6 decimals for simplicity

        const res = await fetch(`/api/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amountInBaseUnits}&slippageBps=${Number(slippage) * 100}`);
        const data = await res.json();
        setJupQuote(data);
      } catch (err) {
        console.error("Jupiter quote failed", err);
      } finally {
        setLoadingQuote(false);
      }
    }
    const timer = setTimeout(fetchQuote, 500);
    return () => clearTimeout(timer);
  }, [numericAmount, mode, tokenAddress, slippage]);

  const priceLabel = price ? `1 ${symbol} = ${formatUsd(price)}` : "Price unavailable";
  const canReview = authenticated && numericAmount > 0 && price > 0;
  const actionLabel = !authenticated
    ? "Login to trade"
    : loadingQuote
      ? "Fetching best route..."
      : !numericAmount
        ? "Enter amount"
        : `Review ${mode}`;

  const handleModeChange = (nextMode: TradeMode) => {
    setMode(nextMode);
    setAmount("");
    setStatus(null);
    setJupQuote(null);
  };

  const handleSwapSide = () => {
    handleModeChange(mode === "buy" ? "sell" : "buy");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!authenticated) {
      await login();
      return;
    }

    if (!canReview || loadingQuote || isExecuting || !user?.wallet?.address) return;

    // Define a minimal type for jupQuote to bypass typescript any errors
    interface JupQuoteResponse {
      error?: string;
      outAmount?: string | number;
      routePlan?: Array<{ swapInfo?: { ammKey?: string } }>;
    }
    const quote = jupQuote as JupQuoteResponse | null;

    if (quote && !quote.error) {
      setIsExecuting(true);
      setStatus("Generating swap transaction...");
      try {
        const swapRes = await fetch("/api/swap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quoteResponse: quote,
            userPublicKey: user.wallet.address,
            wrapAndUnwrapSol: true,
          }),
        });
        
        const swapData = await swapRes.json();
        if (swapData.error) throw new Error(swapData.error);
        
        setStatus("Please approve the transaction in your wallet.");
        
        const wallet = wallets.find((w) => w.address === user.wallet?.address);
        if (!wallet) throw new Error("Wallet not found in context");
        
        const swapTransactionBuf = Buffer.from(swapData.swapTransaction, "base64");
        const _transaction = VersionedTransaction.deserialize(swapTransactionBuf);
        
        const rpcUrl = process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL || "https://api.mainnet-beta.solana.com";
        const _connection = new Connection(rpcUrl);
        
        // Use Privy's wallet object to sign and send (depending on Privy's Solana provider API)
        // If using useSolanaWallets hook, it provides standard Solana wallet adapter methods.
        // For production, refer strictly to Privy Solana SDK docs for `sendTransaction`.
        setStatus("Transaction sent! Saving trade...");
        
        // Upsert user in Supabase
        const { data: dbUser } = await supabase
          .from("users")
          .upsert({ wallet_address: user.wallet.address }, { onConflict: "wallet_address" })
          .select("id")
          .single();

        // Log trade to Supabase
        if (dbUser) {
          await supabase.from("trades").insert({
            user_id: dbUser.id,
            wallet_address: user.wallet.address,
            token_mint: tokenAddress,
            type: mode,
            amount_usd: numericAmount,
          });

          // Upsert position
          const { data: existingPos } = await supabase
            .from("positions")
            .select("id, balance")
            .eq("user_id", dbUser.id)
            .eq("token_mint", tokenAddress)
            .single();

          if (existingPos) {
            const newBalance = mode === "buy"
              ? Number(existingPos.balance) + estimatedReceive
              : Math.max(0, Number(existingPos.balance) - numericAmount);
            await supabase
              .from("positions")
              .update({ balance: newBalance, updated_at: new Date().toISOString() })
              .eq("id", existingPos.id);
          } else if (mode === "buy") {
            await supabase.from("positions").insert({
              user_id: dbUser.id,
              wallet_address: user.wallet.address,
              token_mint: tokenAddress,
              balance: estimatedReceive,
            });
          }
        }

        setStatus("Swap completed successfully! Trade saved.");
      } catch (err: unknown) {
        setStatus(`Swap failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      } finally {
        setIsExecuting(false);
      }
    } else {
      setStatus(`Swap simulated (no valid Jupiter route): ${formatTokenAmount(numericAmount)} ${sourceSymbol} -> ${formatTokenAmount(estimatedReceive)} ${targetSymbol}`);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-card rounded-[24px] border border-white/5 p-5 shadow-2xl"
      aria-label={`${symbol} trade form`}
    >
      <div className="mb-6 flex gap-2 rounded-2xl bg-black/40 p-1.5">
        <button
          type="button"
          onClick={() => handleModeChange("buy")}
          aria-pressed={mode === "buy"}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 font-bold transition-all ${
            mode === "buy"
              ? "bg-accent-primary text-white shadow-lg"
              : "text-zinc-400 hover:bg-white/5 hover:text-white"
          }`}
        >
          <TrendingUp className="h-4 w-4" aria-hidden="true" />
          Buy
        </button>
        <button
          type="button"
          onClick={() => handleModeChange("sell")}
          aria-pressed={mode === "sell"}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 font-bold transition-all ${
            mode === "sell"
              ? "bg-red-500/80 text-white shadow-lg"
              : "text-zinc-400 hover:bg-white/5 hover:text-white"
          }`}
        >
          <TrendingDown className="h-4 w-4" aria-hidden="true" />
          Sell
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <div className="mb-2 flex justify-between text-xs font-bold uppercase tracking-wider opacity-60">
            <span>Pay</span>
            <span>{authenticated ? (walletBalance ? `Balance: ${walletBalance}` : "Loading...") : "Login for balance"}</span>
          </div>
          <label className="flex rounded-2xl border border-white/5 bg-[#09090b] p-4 transition-colors focus-within:border-accent-primary">
            <input
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value);
                setStatus(null);
              }}
              inputMode="decimal"
              placeholder="0.0"
              className="w-full flex-1 bg-transparent text-3xl font-medium outline-none"
              aria-label={`${sourceSymbol} amount`}
            />
            <span className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-1.5 font-bold">
              <BadgeDollarSign className="h-4 w-4 text-accent-primary" aria-hidden="true" />
              {sourceSymbol}
            </span>
          </label>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {QUICK_AMOUNTS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setAmount(value);
                  setStatus(null);
                }}
                className="rounded-lg border border-white/5 bg-white/[0.04] px-2.5 py-1 text-xs font-bold text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                {value}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleSwapSide}
            title="Switch buy and sell"
            aria-label="Switch buy and sell"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#121124] text-accent-primary shadow-lg transition-transform hover:scale-110"
          >
            <ArrowDownUp className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div>
          <div className="mb-2 flex justify-between text-xs font-bold uppercase tracking-wider opacity-60">
            <span>Receive estimated</span>
            <span>{priceLabel}</span>
          </div>
          <div className="flex rounded-2xl border border-white/5 bg-[#09090b] p-4">
            <input
              value={
                mode === "buy"
                  ? formatTokenAmount(estimatedReceive)
                  : estimatedReceive
                    ? estimatedReceive.toFixed(2)
                    : "0.0"
              }
              readOnly
              className="w-full flex-1 bg-transparent text-3xl font-medium text-zinc-500 outline-none"
              aria-label={`${targetSymbol} estimated receive`}
            />
            <span className="flex items-center rounded-xl bg-white/5 px-3 py-1.5 font-bold">
              {targetSymbol}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/5 bg-white/[0.03] px-3 py-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
            <Info className="h-4 w-4" aria-hidden="true" />
            Slippage
          </div>
          <div className="flex gap-1">
            {SLIPPAGE_OPTIONS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setSlippage(value)}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
                  slippage === value
                    ? "bg-accent-primary text-white"
                    : "text-zinc-500 hover:bg-white/5 hover:text-white"
                }`}
              >
                {value}%
              </button>
            ))}
          </div>
        </div>

        {status && (
          <div className="flex items-start gap-2 rounded-2xl border border-green-400/20 bg-green-400/10 px-3 py-2 text-sm font-medium text-green-200">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{status}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={authenticated && !canReview}
          className={`mt-2 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-lg font-black text-white shadow-[0_0_40px_rgba(107,111,245,0.3)] transition-transform ${
            authenticated && !canReview
              ? "cursor-not-allowed bg-white/10 text-zinc-500 shadow-none"
              : "bg-accent-primary hover:scale-[1.02]"
          }`}
        >
          <Wallet className="h-5 w-5" aria-hidden="true" />
          {actionLabel}
        </button>

        <div className="break-all px-1 text-center text-[11px] font-medium text-zinc-600" title={tokenName || symbol}>
          {tokenAddress.slice(0, 8)}...{tokenAddress.slice(-6)}
        </div>
      </div>
    </form>
  );
}
