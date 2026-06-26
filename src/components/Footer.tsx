import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer
      className="border-t px-8 md:px-20 pt-12 pb-16 flex flex-col md:flex-row gap-12 items-start justify-between"
      style={{ borderColor: "var(--border-subtle)" }}
    >
      {/* Brand */}
      <div className="flex flex-col gap-4">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/assets/logo/light.png" alt="ChadWallet" width={26} height={26} />
          <span className="font-extrabold text-base tracking-tight" style={{ color: "var(--text-primary)" }}>
            ChadWallet
          </span>
        </Link>
        <p className="text-xl font-semibold tracking-tight" style={{ color: "var(--text-secondary)" }}>
          where chads become legends.
        </p>
        <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
          © 2026 ChadWallet. All rights reserved.
        </p>
      </div>

      {/* Links */}
      <div className="flex flex-wrap gap-12">
        <div className="flex flex-col gap-2">
          <div className="feature-tag mb-1">APP</div>
          <Link href="https://apps.apple.com/us/app/chadwallet/id6757367474" target="_blank" className="text-sm hover:opacity-100 transition-opacity" style={{ color: "var(--text-secondary)" }}>
            iOS App Store
          </Link>
          <Link href="https://play.google.com/store/apps/details?id=xyz.chadwallet.www" target="_blank" className="text-sm hover:opacity-100 transition-opacity" style={{ color: "var(--text-secondary)" }}>
            Google Play
          </Link>
          <Link href="/trade/So11111111111111111111111111111111111111112" className="text-sm hover:opacity-100 transition-opacity" style={{ color: "var(--text-secondary)" }}>
            Web Trading
          </Link>
        </div>

        <div className="flex flex-col gap-2">
          <div className="feature-tag mb-1">SOCIAL</div>
          <Link href="https://x.com/chadwallet" target="_blank" className="text-sm hover:opacity-100 transition-opacity" style={{ color: "var(--text-secondary)" }}>
            X / Twitter
          </Link>
          <Link href="#" className="text-sm hover:opacity-100 transition-opacity" style={{ color: "var(--text-secondary)" }}>
            Telegram
          </Link>
          <Link href="#" className="text-sm hover:opacity-100 transition-opacity" style={{ color: "var(--text-secondary)" }}>
            Discord
          </Link>
        </div>

        <div className="flex flex-col gap-2">
          <div className="feature-tag mb-1">LEGAL</div>
          <Link href="#" className="text-sm hover:opacity-100 transition-opacity" style={{ color: "var(--text-secondary)" }}>
            Privacy Policy
          </Link>
          <Link href="#" className="text-sm hover:opacity-100 transition-opacity" style={{ color: "var(--text-secondary)" }}>
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  );
}
