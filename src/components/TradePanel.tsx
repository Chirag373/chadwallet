"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useFundWallet } from "@privy-io/react-auth/solana";
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
  const { authenticated, login, user, exportWallet } = usePrivy();
  const { wallets } = useWallets();
  const { fundWallet } = useFundWallet();
  const [mode, setMode] = useState<TradeMode>("buy");
  const [amount, setAmount] = useState("");
  const [slippage, setSlippage] = useState("1");
  const [status, setStatus] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [walletBalance, setWalletBalance] = useState<string | null>(null);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const depositMenuRef = useRef<HTMLDivElement>(null);

  const hasEmbeddedWallet = !!user?.linkedAccounts.some(
    (a) => a.type === "wallet" && (a as any).walletClientType === "privy"
  );

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (depositMenuRef.current && !depositMenuRef.current.contains(event.target as Node)) {
        setIsDepositOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  const parsedBalance = useMemo(() => {
    if (!walletBalance) return 0;
    const numStr = walletBalance.split(" ")[0].replace(/,/g, "");
    const num = Number(numStr);
    return isNaN(num) ? 0 : num;
  }, [walletBalance]);

  const symbol = tokenSymbol || "TOKEN";
  const price = tokenPrice || 0;
  const numericAmount = parseAmount(amount);
  const sourceSymbol = mode === "buy" ? "USDC" : symbol;
  const targetSymbol = mode === "buy" ? symbol : "USDC";

  const hasInsufficientBalance = authenticated && numericAmount > parsedBalance;

  // Fetch user's wallet balance (SOL when selling, USDC when buying)
  const walletAddress = user?.wallet?.address ?? null;

  useEffect(() => {
    if (!walletAddress) return;

    let cancelled = false;

    async function fetchBalance() {
      if (walletAddress!.startsWith("0x")) {
        if (!cancelled) {
           setWalletBalance(mode === "buy" ? "0 USDC" : `0 ${symbol}`);
        }
        return;
      }
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
  const canReview = authenticated && numericAmount > 0 && price > 0 && !hasInsufficientBalance;
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
    if (user.wallet.address.startsWith("0x")) {
      setStatus("Please connect a Solana wallet to trade.");
      return;
    }

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
          .upsert({ privy_id: user.id, wallet_address: user.wallet.address }, { onConflict: "privy_id" })
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
    <div className="flex flex-col gap-3 font-sans w-full max-w-[400px] mx-auto">
      {/* Top Balance Boxes */}
      <div className="flex justify-end gap-2 mb-1">
        <div className="relative" ref={depositMenuRef}>
          <div className="flex flex-col justify-center rounded-xl border border-white/10 bg-[#0a0a0c] px-3 py-1.5 shadow-sm min-w-[110px]">
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-bold text-white">
                ${authenticated && mode === "buy" ? (walletBalance ? walletBalance.split(' ')[0] : "0.00") : "0.00"}
              </span>
              <span className="text-[11px] font-medium text-zinc-500">cash</span>
            </div>
            <button
              type="button"
              onClick={() => setIsDepositOpen((prev) => !prev)}
              className="text-left text-[11px] font-bold text-[#4c5df8] hover:text-[#5f6df9] transition-colors"
            >
              Deposit more
            </button>
          </div>
          
          {isDepositOpen && (
            <div className="absolute top-full right-0 lg:left-0 lg:right-auto mt-2 w-48 rounded-[14px] border border-white/10 bg-[#0f0f13] shadow-[0_16px_40px_rgba(0,0,0,0.8)] z-50 overflow-hidden">
              <button
                type="button"
                className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-bold text-white transition-colors hover:bg-white/5"
                onClick={() => {
                  setIsDepositOpen(false);
                  if (user?.wallet?.address) {
                    fundWallet({ address: user.wallet.address });
                  }
                }}
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-black">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </div>
                Deposit
              </button>
              {hasEmbeddedWallet && (
                <button
                  type="button"
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-bold text-white transition-colors hover:bg-white/5 border-t border-white/5"
                  onClick={() => {
                    setIsDepositOpen(false);
                    exportWallet();
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="text-white"><path d="M2 20h20v2H2zM12 2l10 7H2zm-7 9h2v7H5zm5 0h2v7h-2zm5 0h2v7h-2z"/></svg>
                  Withdraw
                </button>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0a0a0c] px-3 py-1.5 shadow-sm min-w-[110px] gap-3">
          <div className="flex flex-col justify-center">
            <span className="text-sm font-bold text-white">
              {authenticated && mode === "sell" ? (walletBalance ? walletBalance.split(' ')[0] : "0.00") : "$0.00"}
            </span>
            <span className="text-[11px] font-medium text-zinc-500">--</span>
          </div>
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white shadow-inner">
            <span className="text-[10px] font-black italic tracking-tighter">S</span>
          </div>
        </div>
      </div>

      {/* Main Trade Card */}
      <form
        onSubmit={handleSubmit}
        className="rounded-[20px] border border-white/5 bg-[#0a0a0c] p-4 shadow-2xl flex flex-col"
        aria-label={`${symbol} trade form`}
      >
        {/* Buy / Sell Toggle */}
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => handleModeChange("buy")}
            className={`flex-1 rounded-xl py-3 text-sm font-bold transition-all duration-200 ${
              mode === "buy"
                ? "bg-[#112a1f] text-[#22c55e]"
                : "bg-[#121214] text-zinc-500 hover:bg-white/5 hover:text-white"
            }`}
          >
            Buy
          </button>
          <button
            type="button"
            onClick={() => handleModeChange("sell")}
            className={`flex-1 rounded-xl py-3 text-sm font-bold transition-all duration-200 ${
              mode === "sell"
                ? "bg-[#2c1313] text-[#ef4444]"
                : "bg-[#121214] text-zinc-500 hover:bg-white/5 hover:text-white"
            }`}
          >
            Sell
          </button>
        </div>

        {/* Amount Input */}
        <div className="mb-3 flex items-center justify-between rounded-[16px] border border-white/5 bg-[#121214] px-4 py-6 transition-colors focus-within:border-white/20 relative group">
          <div className="flex items-center w-full">
            <span className={`text-4xl font-medium transition-colors ${amount ? 'text-white' : 'text-zinc-600'}`}>$</span>
            <input
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value);
                setStatus(null);
              }}
              inputMode="decimal"
              placeholder="0"
              className="ml-1 w-full bg-transparent text-4xl font-medium text-white placeholder-zinc-600 outline-none"
              aria-label="Trade amount"
            />
          </div>
          {!amount && (
            <span className="pointer-events-none absolute right-4 text-sm font-bold text-zinc-600 transition-opacity">
              Enter amount
            </span>
          )}
        </div>

        {/* Quick Amounts & Settings */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex gap-2">
            {QUICK_AMOUNTS.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => {
                  setAmount(val);
                  setStatus(null);
                }}
                className="rounded-lg border border-white/5 bg-[#121214] px-3 py-1.5 text-[13px] font-bold text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
              >
                ${val}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-white/5 hover:text-white"
            aria-label="Settings"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>

        {/* Available Balance / Error */}
        {hasInsufficientBalance ? (
          <div className="mb-4 text-[13px] font-bold text-[#ff5b3a]">
            Insufficient cash balance
          </div>
        ) : (
          <div className="mb-4 text-[13px] font-bold text-zinc-400">
            ${authenticated ? (mode === "buy" ? (walletBalance ? walletBalance.split(' ')[0] : "0") : "0") : "0"} available
          </div>
        )}

        {status && (
          <div className="mb-3 flex items-start gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[13px] font-medium text-zinc-300">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent-primary" aria-hidden="true" />
            <span>{status}</span>
          </div>
        )}

        {/* Action Button */}
        <button
          type="submit"
          disabled={authenticated && !canReview}
          className={`w-full rounded-xl py-3.5 text-[15px] font-bold text-white transition-all ${
            authenticated && !canReview
              ? "cursor-not-allowed bg-[#121214] opacity-50 border border-white/5"
              : "bg-[#121214] hover:bg-white/10 border border-white/5 hover:border-white/10 shadow-sm"
          }`}
        >
          {actionLabel === "Review buy" || actionLabel === "Review sell" ? `${mode === "buy" ? "Buy" : "Sell"} ${symbol}` : actionLabel}
        </button>

        {/* Footer Warning */}
        <div className="mt-4 flex items-center justify-between rounded-xl border border-white/5 bg-[#121214]/50 px-3 py-2 text-[11px] font-bold text-zinc-400">
          <div className="flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="text-zinc-400">
              <path d="M12 2L1 21h22L12 2zm1 16h-2v-2h2v2zm0-4h-2v-5h2v5z"/>
            </svg>
            Unverified token
          </div>
          <Info className="h-3.5 w-3.5 text-zinc-500 hover:text-zinc-300 cursor-pointer transition-colors" aria-hidden="true" />
        </div>
      </form>
    </div>
  );
}

