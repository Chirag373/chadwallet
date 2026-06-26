import type { User } from "@privy-io/react-auth";

/**
 * Resolve the best Solana wallet address for a Privy user.
 *
 * Priority:
 * 1. Externally linked Solana wallet (e.g. Phantom) — the user explicitly connected it.
 * 2. Privy-embedded Solana wallet — auto-created when they sign up with OAuth.
 *
 * This ensures the identity stays tied to the OAuth login (user.id),
 * while on-chain operations use the correct Solana address.
 */
export function getSolanaAddress(user: User | null): string | null {
  if (!user) return null;

  const wallets = user.linkedAccounts.filter(
    (a): a is Extract<typeof a, { type: "wallet"; chainType: string }> =>
      a.type === "wallet" && "chainType" in a && (a as { chainType?: string }).chainType === "solana",
  );

  if (wallets.length === 0) return null;

  // Prefer externally linked wallets over the embedded one
  const external = wallets.find(
    (w) => "walletClientType" in w && (w as { walletClientType?: string }).walletClientType !== "privy",
  );

  return external?.address ?? wallets[0]?.address ?? null;
}
