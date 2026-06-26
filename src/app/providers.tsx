"use client";

import { PrivyProvider } from "@privy-io/react-auth";

export function Providers({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "insert-privy-app-id-here";

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ["apple", "google"],
        appearance: {
          theme: "dark",
          accentColor: "#676FFF",
          logo: "/assets/logo/light.png",
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
