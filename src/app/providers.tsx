"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";

export function Providers({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "insert-privy-app-id-here";
  const solanaConnectors = toSolanaWalletConnectors();

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ["wallet", "apple", "google"],
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
