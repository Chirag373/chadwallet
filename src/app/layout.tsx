import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const viewport: Viewport = {
  themeColor: "#060510",
};

export const metadata: Metadata = {
  title: "ChadWallet — Trade Solana Memecoins Instantly",
  description:
    "The fastest self-custodial Solana wallet. Buy, sell, and discover trending memecoins instantly. Social trading built for the trenches.",
  openGraph: {
    title: "ChadWallet — Trade Solana Memecoins Instantly",
    description:
      "The fastest self-custodial Solana wallet. Buy, sell, and discover trending memecoins instantly.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
