import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

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
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
