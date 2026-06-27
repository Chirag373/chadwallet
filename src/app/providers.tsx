"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";
import { createSolanaRpc, createSolanaRpcSubscriptions } from "@solana/kit";

export function Providers({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "insert-privy-app-id-here";
  const rpcUrl = process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL || "https://api.mainnet-beta.solana.com";
  const websocketUrl = rpcUrl.replace(/^http/, "ws");
  const solanaConnectors = toSolanaWalletConnectors();

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ["wallet", "apple", "google"],
        embeddedWallets: {
          solana: {
            createOnLogin: "all-users",
          },
        },
        solana: {
          rpcs: {
            "solana:mainnet": {
              rpc: createSolanaRpc(rpcUrl),
              rpcSubscriptions: createSolanaRpcSubscriptions(websocketUrl),
            },
          },
        },
        appearance: {
          theme: "dark",
          accentColor: "#676FFF",
          logo: "/assets/logo/light.png",
          walletChainType: "solana-only",
        },
        externalWallets: {
          solana: {
            connectors: solanaConnectors,
          },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
