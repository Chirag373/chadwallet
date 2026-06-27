"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import {
  useExportWallet,
  useFundWallet,
  useSignTransaction,
  useWallets,
} from "@privy-io/react-auth/solana";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import {
  CheckCircle2,
  ExternalLink,
  Info,
  Landmark,
  Plus,
  Settings2,
  TriangleAlert,
} from "lucide-react";

import { getSolanaAddress } from "@/lib/solana-wallet";
import { supabase } from "@/lib/supabase";
import { baseUnitsToUiAmount, uiAmountToBaseUnits } from "@/lib/token-amounts";

type TradeMode = "buy" | "sell";
type StatusKind = "info" | "success" | "error";

interface TradePanelProps {
  tokenAddress: string;
  tokenSymbol?: string | null;
  tokenDecimals?: number | null;
}

interface JupiterOrder {
  error?: string;
  errorCode?: number;
  errorMessage?: string;
  feeBps?: number;
  inAmount: string;
  mode?: string;
  outAmount: string;
  priceImpact?: number;
  priceImpactPct?: string;
  requestId?: string;
  router?: string;
  transaction?: string | null;
}

interface JupiterExecution {
  code?: number;
  error?: string;
  inputAmountResult?: string;
  outputAmountResult?: string;
  signature?: string;
  status?: "Success" | "Failed";
}

interface TradeStatus {
  kind: StatusKind;
  message: string;
  signature?: string;
}

const BUY_AMOUNTS = ["10", "50", "100", "500"];
const SELL_PERCENTAGES = [25, 50, 75, 100];
const SLIPPAGE_OPTIONS = ["0.5", "1", "3"];
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const WRAPPED_SOL_MINT = "So11111111111111111111111111111111111111112";

function parseAmount(value: string) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}

function formatTokenAmount(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0";
  if (value >= 1_000_000) {
    return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
  }
  if (value >= 1) {
    return value.toLocaleString("en-US", { maximumFractionDigits: 4 });
  }
  return value.toLocaleString("en-US", { maximumSignificantDigits: 6 });
}

function decodeBase64(value: string) {
  const binary = window.atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function encodeBase64(value: Uint8Array) {
  let binary = "";
  for (const byte of value) binary += String.fromCharCode(byte);
  return window.btoa(binary);
}

async function readWalletBalance(
  walletAddress: string,
  inputMint: string,
): Promise<number> {
  const rpcUrl =
    process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL ||
    "https://api.mainnet-beta.solana.com";
  const connection = new Connection(rpcUrl);
  const owner = new PublicKey(walletAddress);

  if (inputMint === WRAPPED_SOL_MINT) {
    const lamports = await connection.getBalance(owner);
    return lamports / LAMPORTS_PER_SOL;
  }

  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(owner, {
    mint: new PublicKey(inputMint),
  });
  return tokenAccounts.value.reduce((sum, account) => {
    const uiAmount = account.account.data.parsed.info.tokenAmount.uiAmount;
    return sum + (Number(uiAmount) || 0);
  }, 0);
}

export function TradePanel({
  tokenAddress,
  tokenSymbol,
  tokenDecimals: initialTokenDecimals,
}: TradePanelProps) {
  const { authenticated, linkWallet, login, user } = usePrivy();
  const { wallets } = useWallets();
  const { fundWallet } = useFundWallet();
  const { exportWallet } = useExportWallet();
  const { signTransaction } = useSignTransaction();

  const [mode, setMode] = useState<TradeMode>("buy");
  const [amount, setAmount] = useState("");
  const [slippage, setSlippage] = useState("1");
  const [status, setStatus] = useState<TradeStatus | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [resolvedTokenDecimals, setResolvedTokenDecimals] = useState<number | null>(null);
  const [order, setOrder] = useState<JupiterOrder | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const depositMenuRef = useRef<HTMLDivElement>(null);

  const symbol = tokenSymbol || "TOKEN";
  const tokenDecimals = initialTokenDecimals ?? resolvedTokenDecimals;
  const numericAmount = parseAmount(amount);
  const inputDecimals = mode === "buy" ? 6 : tokenDecimals;
  const outputDecimals = mode === "buy" ? tokenDecimals : 6;

  const linkedSolanaAddress = useMemo(
    () => getSolanaAddress(user),
    [user],
  );
  const selectedWallet = useMemo(
    () =>
      wallets.find((wallet) => wallet.address === linkedSolanaAddress) ||
      wallets[0] ||
      null,
    [linkedSolanaAddress, wallets],
  );
  const walletAddress = selectedWallet?.address || linkedSolanaAddress;

  const hasEmbeddedWallet = Boolean(
    user?.linkedAccounts.some(
      (account) =>
        account.type === "wallet" &&
        "chainType" in account &&
        account.chainType === "solana" &&
        "walletClientType" in account &&
        account.walletClientType === "privy",
    ),
  );

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (depositMenuRef.current && !depositMenuRef.current.contains(event.target as Node)) {
        setIsDepositOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (tokenDecimals !== null) return;

    let cancelled = false;
    async function resolveTokenDecimals() {
      try {
        if (tokenAddress === WRAPPED_SOL_MINT) {
          if (!cancelled) setResolvedTokenDecimals(9);
          return;
        }
        const rpcUrl =
          process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL ||
          "https://api.mainnet-beta.solana.com";
        const connection = new Connection(rpcUrl);
        const account = await connection.getParsedAccountInfo(new PublicKey(tokenAddress));
        const parsed = account.value?.data;
        if (
          parsed &&
          "parsed" in parsed &&
          typeof parsed.parsed?.info?.decimals === "number" &&
          !cancelled
        ) {
          setResolvedTokenDecimals(parsed.parsed.info.decimals);
        }
      } catch (error) {
        console.error("Failed to resolve token decimals:", error);
      }
    }
    void resolveTokenDecimals();
    return () => {
      cancelled = true;
    };
  }, [tokenAddress, tokenDecimals]);

  useEffect(() => {
    if (!walletAddress) return;

    let cancelled = false;
    async function syncBalance() {
      try {
        const inputMint = mode === "buy" ? USDC_MINT : tokenAddress;
        const nextBalance = await readWalletBalance(walletAddress!, inputMint);
        if (!cancelled) setBalance(nextBalance);
      } catch (error) {
        console.error("Failed to fetch wallet balance:", error);
        if (!cancelled) setBalance(null);
      }
    }
    void syncBalance();
    return () => {
      cancelled = true;
    };
  }, [mode, tokenAddress, walletAddress]);

  useEffect(() => {
    if (!numericAmount || inputDecimals === null || outputDecimals === null) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoadingQuote(true);
      setQuoteError(null);

      try {
        const inputMint = mode === "buy" ? USDC_MINT : tokenAddress;
        const outputMint = mode === "buy" ? tokenAddress : USDC_MINT;
        const amountInBaseUnits = uiAmountToBaseUnits(amount, inputDecimals);
        const params = new URLSearchParams({
          inputMint,
          outputMint,
          amount: amountInBaseUnits,
          slippageBps: String(Math.round(Number(slippage) * 100)),
        });
        if (authenticated && walletAddress) params.set("taker", walletAddress);

        const response = await fetch(`/api/quote?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = (await response.json()) as JupiterOrder;
        if (!response.ok || data.error) {
          throw new Error(data.error || "No Jupiter route is available.");
        }
        setOrder(data);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setOrder(null);
        setQuoteError(error instanceof Error ? error.message : "Unable to load a quote.");
      } finally {
        if (!controller.signal.aborted) setLoadingQuote(false);
      }
    }, 400);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [
    amount,
    authenticated,
    inputDecimals,
    mode,
    numericAmount,
    outputDecimals,
    slippage,
    tokenAddress,
    walletAddress,
  ]);

  const estimatedReceive =
    order && outputDecimals !== null
      ? baseUnitsToUiAmount(order.outAmount, outputDecimals)
      : 0;
  const hasInsufficientBalance =
    authenticated &&
    balance !== null &&
    numericAmount > balance;
  const canExecute =
    authenticated &&
    Boolean(selectedWallet) &&
    numericAmount > 0 &&
    Boolean(order?.transaction && order.requestId) &&
    !hasInsufficientBalance &&
    !loadingQuote &&
    !isExecuting;

  const actionLabel = !authenticated
    ? "Login to trade"
    : !selectedWallet
      ? "Connect Solana wallet"
      : isExecuting
        ? "Executing swap..."
        : loadingQuote
          ? "Finding best route..."
          : !numericAmount
            ? "Enter amount"
            : quoteError
              ? "Route unavailable"
              : order?.errorMessage
                ? order.errorMessage
                : `${mode === "buy" ? "Buy" : "Sell"} ${symbol}`;

  function handleModeChange(nextMode: TradeMode) {
    setMode(nextMode);
    setAmount("");
    setOrder(null);
    setQuoteError(null);
    setStatus(null);
  }

  async function persistTrade(
    execution: JupiterExecution,
    actualInput: number,
    actualOutput: number,
  ) {
    if (!user || !walletAddress || !execution.signature) return;

    const { data: dbUser, error: userError } = await supabase
      .from("users")
      .upsert(
        {
          privy_id: user.id,
          wallet_address: walletAddress,
        },
        { onConflict: "privy_id" },
      )
      .select("id")
      .single();
    if (userError || !dbUser) throw userError || new Error("Unable to sync account.");

    const amountUsd = mode === "buy" ? actualInput : actualOutput;
    const { error: tradeError } = await supabase.from("trades").insert({
      user_id: dbUser.id,
      wallet_address: walletAddress,
      token_mint: tokenAddress,
      token_symbol: symbol,
      type: mode,
      amount_usd: amountUsd,
      tx_signature: execution.signature,
    });
    if (tradeError) throw tradeError;

    const tokenDelta = mode === "buy" ? actualOutput : -actualInput;
    const { data: existingPosition } = await supabase
      .from("positions")
      .select("id, balance")
      .eq("user_id", dbUser.id)
      .eq("token_mint", tokenAddress)
      .maybeSingle();

    if (existingPosition) {
      await supabase
        .from("positions")
        .update({
          balance: Math.max(0, Number(existingPosition.balance) + tokenDelta),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingPosition.id);
    } else if (tokenDelta > 0) {
      await supabase.from("positions").insert({
        user_id: dbUser.id,
        wallet_address: walletAddress,
        token_mint: tokenAddress,
        balance: tokenDelta,
      });
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!authenticated) {
      await login();
      return;
    }
    if (!selectedWallet) {
      await linkWallet({ walletChainType: "solana-only" });
      return;
    }
    if (!canExecute || !order?.transaction || !order.requestId) return;

    setIsExecuting(true);
    setStatus({ kind: "info", message: "Approve the Jupiter swap in your wallet." });

    try {
      const { signedTransaction } = await signTransaction({
        transaction: decodeBase64(order.transaction),
        wallet: selectedWallet,
      });

      setStatus({ kind: "info", message: "Submitting the signed swap to Jupiter." });
      const response = await fetch("/api/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signedTransaction: encodeBase64(signedTransaction),
          requestId: order.requestId,
        }),
      });
      const execution = (await response.json()) as JupiterExecution;
      if (
        !response.ok ||
        execution.status !== "Success" ||
        execution.code !== 0 ||
        !execution.signature
      ) {
        throw new Error(execution.error || "Jupiter could not confirm this swap.");
      }

      const actualInput = baseUnitsToUiAmount(
        execution.inputAmountResult || order.inAmount,
        inputDecimals!,
      );
      const actualOutput = baseUnitsToUiAmount(
        execution.outputAmountResult || order.outAmount,
        outputDecimals!,
      );

      try {
        await persistTrade(execution, actualInput, actualOutput);
        setStatus({
          kind: "success",
          message: `Swap confirmed: ${formatTokenAmount(actualInput)} ${mode === "buy" ? "USDC" : symbol} → ${formatTokenAmount(actualOutput)} ${mode === "buy" ? symbol : "USDC"}.`,
          signature: execution.signature,
        });
      } catch (syncError) {
        console.error("Trade persistence failed:", syncError);
        setStatus({
          kind: "success",
          message: "Swap confirmed on Solana. Dashboard sync is temporarily unavailable.",
          signature: execution.signature,
        });
      }

      setAmount("");
      setOrder(null);
      if (walletAddress) {
        try {
          const inputMint = mode === "buy" ? USDC_MINT : tokenAddress;
          setBalance(await readWalletBalance(walletAddress, inputMint));
        } catch (balanceError) {
          console.error("Failed to refresh wallet balance:", balanceError);
        }
      }
    } catch (error) {
      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "The swap failed.",
      });
    } finally {
      setIsExecuting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[400px] flex-col gap-3 font-sans">
      <div className="mb-1 flex justify-end gap-2">
        <div className="relative" ref={depositMenuRef}>
          <div className="min-w-[118px] rounded-xl border border-white/10 bg-[#0a0a0c] px-3 py-1.5 shadow-sm">
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-bold text-white">
                {balance === null ? "--" : formatTokenAmount(balance)}
              </span>
              <span className="text-[11px] font-medium text-zinc-500">
                {mode === "buy" ? "USDC" : symbol}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsDepositOpen((open) => !open)}
              className="text-left text-[11px] font-bold text-[#6f7cff] transition-colors hover:text-[#8c95ff]"
            >
              Manage funds
            </button>
          </div>

          {isDepositOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-[14px] border border-white/10 bg-[#0f0f13] shadow-[0_16px_40px_rgba(0,0,0,0.8)] lg:left-0 lg:right-auto">
              <button
                type="button"
                className="flex w-full items-center gap-3 px-4 py-3.5 text-sm font-bold text-white transition-colors hover:bg-white/5"
                onClick={() => {
                  setIsDepositOpen(false);
                  if (walletAddress) void fundWallet({ address: walletAddress });
                }}
              >
                <Plus className="h-5 w-5 rounded-full bg-white p-1 text-black" aria-hidden="true" />
                Deposit
              </button>
              {hasEmbeddedWallet && walletAddress && (
                <button
                  type="button"
                  className="flex w-full items-center gap-3 border-t border-white/5 px-4 py-3.5 text-sm font-bold text-white transition-colors hover:bg-white/5"
                  onClick={() => {
                    setIsDepositOpen(false);
                    void exportWallet({ address: walletAddress });
                  }}
                >
                  <Landmark className="h-5 w-5 text-zinc-300" aria-hidden="true" />
                  Export wallet
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col rounded-[20px] border border-white/5 bg-[#0a0a0c] p-4 shadow-2xl"
        aria-label={`${symbol} trade form`}
      >
        <div className="mb-4 flex gap-2">
          {(["buy", "sell"] as const).map((tradeMode) => (
            <button
              key={tradeMode}
              type="button"
              onClick={() => handleModeChange(tradeMode)}
              className={`flex-1 rounded-xl py-3 text-sm font-bold capitalize transition-colors ${
                mode === tradeMode
                  ? tradeMode === "buy"
                    ? "bg-[#112a1f] text-[#22c55e]"
                    : "bg-[#2c1313] text-[#ef4444]"
                  : "bg-[#121214] text-zinc-500 hover:bg-white/5 hover:text-white"
              }`}
            >
              {tradeMode}
            </button>
          ))}
        </div>

        <div className="group relative mb-3 flex items-center rounded-[16px] border border-white/5 bg-[#121214] px-4 py-6 transition-colors focus-within:border-white/20">
          {mode === "buy" && (
            <span className={`text-4xl font-medium ${amount ? "text-white" : "text-zinc-600"}`}>
              $
            </span>
          )}
          <input
            value={amount}
            onChange={(event) => {
              const nextValue = event.target.value;
              if (/^\d*(?:\.\d*)?$/.test(nextValue)) {
                setAmount(nextValue);
                setStatus(null);
                if (!parseAmount(nextValue)) {
                  setOrder(null);
                  setQuoteError(null);
                  setLoadingQuote(false);
                }
              }
            }}
            inputMode="decimal"
            placeholder="0"
            className={`${mode === "buy" ? "ml-1" : ""} w-full bg-transparent text-4xl font-medium text-white placeholder-zinc-600 outline-none`}
            aria-label="Trade amount"
          />
          <span className="text-sm font-bold text-zinc-500">
            {mode === "buy" ? "USDC" : symbol}
          </span>
        </div>

        <div className="relative mb-4 flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 gap-2">
            {mode === "buy"
              ? BUY_AMOUNTS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setAmount(value);
                      setStatus(null);
                    }}
                    className="min-w-0 flex-1 rounded-lg border border-white/5 bg-[#121214] px-2 py-1.5 text-[13px] font-bold text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    ${value}
                  </button>
                ))
              : SELL_PERCENTAGES.map((percentage) => (
                  <button
                    key={percentage}
                    type="button"
                    disabled={!balance}
                    onClick={() => {
                      if (!balance) return;
                      setAmount(String((balance * percentage) / 100));
                      setStatus(null);
                    }}
                    className="min-w-0 flex-1 rounded-lg border border-white/5 bg-[#121214] px-2 py-1.5 text-[13px] font-bold text-zinc-300 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {percentage}%
                  </button>
                ))}
          </div>
          <details className="group shrink-0">
            <summary
              className="flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-white/5 hover:text-white group-open:bg-white/10 group-open:text-white"
              aria-label="Trade settings"
            >
              <Settings2 className="pointer-events-none h-4 w-4" aria-hidden="true" />
            </summary>
            <div className="absolute right-0 top-10 z-20 w-64 rounded-xl border border-white/10 bg-[#121214] p-3 shadow-2xl">
              <div className="mb-2 flex items-center justify-between text-xs font-bold">
                <span className="text-zinc-300">Slippage tolerance</span>
                <span className="text-[#8c95ff]">{slippage}%</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {SLIPPAGE_OPTIONS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSlippage(value)}
                    className={`rounded-lg px-2 py-2 text-xs font-bold transition-colors ${
                      slippage === value
                        ? "bg-accent-primary text-white"
                        : "bg-black/20 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {value}%
                  </button>
                ))}
              </div>
            </div>
          </details>
        </div>

        <div className="mb-4 flex items-center justify-between text-[13px] font-bold">
          <span className={hasInsufficientBalance ? "text-[#ff5b3a]" : "text-zinc-400"}>
            {hasInsufficientBalance
              ? `Insufficient ${mode === "buy" ? "USDC" : symbol} balance`
              : `${balance === null ? "--" : formatTokenAmount(balance)} ${mode === "buy" ? "USDC" : symbol} available`}
          </span>
          {order && estimatedReceive > 0 && (
            <span className="text-right text-zinc-300">
              ≈ {formatTokenAmount(estimatedReceive)} {mode === "buy" ? symbol : "USDC"}
            </span>
          )}
        </div>

        {order && (
          <div className="mb-3 grid grid-cols-2 gap-2 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2 text-[11px] font-bold">
            <div>
              <div className="text-zinc-500">Route</div>
              <div className="mt-0.5 uppercase text-zinc-200">{order.router || "Jupiter"}</div>
            </div>
            <div className="text-right">
              <div className="text-zinc-500">Price impact</div>
              <div className="mt-0.5 text-zinc-200">
                {typeof order.priceImpact === "number"
                  ? `${(order.priceImpact * 100).toFixed(3)}%`
                  : order.priceImpactPct
                    ? `${Number(order.priceImpactPct).toFixed(3)}%`
                    : "--"}
              </div>
            </div>
          </div>
        )}

        {quoteError && (
          <div className="mb-3 flex items-start gap-2 rounded-xl border border-red-400/15 bg-red-400/5 px-3 py-2 text-[13px] font-medium text-red-200">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{quoteError}</span>
          </div>
        )}

        {status && (
          <div
            className={`mb-3 flex items-start gap-2 rounded-xl border px-3 py-2 text-[13px] font-medium ${
              status.kind === "error"
                ? "border-red-400/15 bg-red-400/5 text-red-200"
                : status.kind === "success"
                  ? "border-emerald-400/15 bg-emerald-400/5 text-emerald-200"
                  : "border-white/10 bg-white/5 text-zinc-300"
            }`}
          >
            {status.kind === "error" ? (
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            <span className="min-w-0 flex-1">{status.message}</span>
            {status.signature && (
              <a
                href={`https://solscan.io/tx/${status.signature}`}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 text-emerald-300 hover:text-white"
                aria-label="View transaction on Solscan"
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={authenticated && Boolean(selectedWallet) && !canExecute}
          className={`w-full rounded-xl border border-white/5 py-3.5 text-[15px] font-bold text-white transition-colors ${
            authenticated && Boolean(selectedWallet) && !canExecute
              ? "cursor-not-allowed bg-[#121214] opacity-50"
              : "bg-[#5e68f5] hover:bg-[#7079ff]"
          }`}
        >
          {actionLabel}
        </button>

        <div className="mt-4 flex items-center justify-between rounded-xl border border-white/5 bg-[#121214]/50 px-3 py-2 text-[11px] font-bold text-zinc-400">
          <div className="flex items-center gap-1.5">
            <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />
            Verify token details before trading
          </div>
          <Info className="h-3.5 w-3.5 text-zinc-500" aria-hidden="true" />
        </div>
      </form>
    </div>
  );
}
