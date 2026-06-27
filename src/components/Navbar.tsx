"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePrivy } from "@privy-io/react-auth";
import { ChevronDown, LayoutDashboard, LogOut, UserRound } from "lucide-react";

import { TokenSearch } from "./TokenSearch";

function shortenAccount(value: string) {
  if (value.length <= 18) return value;
  const [name, domain] = value.split("@");
  if (domain) return `${name.slice(0, 11)}...`;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

export function Navbar() {
  const { login, logout, authenticated, user } = usePrivy();
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  const accountLabel = useMemo(() => {
    const email = user?.email?.address || user?.google?.email || user?.apple?.email;
    const wallet = user?.wallet?.address;
    return shortenAccount(email || wallet || "Not connected");
  }, [user]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsAccountOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleLogout = async () => {
    setIsAccountOpen(false);
    await logout();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center h-16 px-6 justify-between gap-4"
      style={{ background: "linear-gradient(to bottom, rgba(6,5,16,0.9) 0%, rgba(6,5,16,0) 100%)", backdropFilter: "blur(0px)" }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity shrink-0">
        <Image src="/assets/logo/light.png" alt="ChadWallet" width={28} height={28} />
        <span className="text-lg font-extrabold tracking-tight hidden sm:block" style={{ color: "var(--text-primary)" }}>
          ChadWallet
        </span>
      </Link>

      {/* Global Search Bar */}
      <div className="flex-1 flex justify-center max-w-2xl px-4">
        <TokenSearch />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* App store buttons — desktop */}
        <div className="hidden md:flex items-center gap-2">
          <Link
            href="https://apps.apple.com/us/app/chadwallet/id6757367474"
            target="_blank"
            className="btn-ghost flex items-center gap-2"
            style={{ padding: "8px 16px", borderRadius: "10px", fontSize: "0.8125rem" }}
          >
            <Image
              src="https://upload.wikimedia.org/wikipedia/commons/3/31/Apple_logo_white.svg"
              alt="Apple"
              width={16}
              height={16}
              style={{ width: "16px", height: "16px" }}
              unoptimized
            />
            App Store
          </Link>
          <Link
            href="https://play.google.com/store/apps/details?id=xyz.chadwallet.www"
            target="_blank"
            className="btn-ghost flex items-center gap-2"
            style={{ padding: "8px 16px", borderRadius: "10px", fontSize: "0.8125rem" }}
          >
            <Image
              src="https://upload.wikimedia.org/wikipedia/commons/d/d0/Google_Play_Arrow_logo.svg"
              alt="Google Play"
              width={16}
              height={16}
              style={{ width: "16px", height: "16px" }}
              unoptimized
            />
            Google Play
          </Link>
        </div>

        {/* Auth button */}
        {authenticated ? (
          <div ref={accountMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setIsAccountOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={isAccountOpen}
              className="btn-ghost flex items-center gap-2 max-w-[180px]"
              style={{ padding: "8px 12px", borderRadius: "10px", fontSize: "0.875rem" }}
              title={user?.email?.address || user?.wallet?.address || "Account"}
            >
              <UserRound className="w-4 h-4 text-accent-primary shrink-0" aria-hidden="true" />
              <span className="font-bold truncate">{accountLabel}</span>
              <ChevronDown
                className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform ${isAccountOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>

            {isAccountOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-2xl border border-white/10 bg-[#15141f] shadow-[0_24px_60px_rgba(0,0,0,0.55)]"
              >
                <Link
                  href="/dashboard"
                  role="menuitem"
                  onClick={() => setIsAccountOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-white/[0.07]"
                >
                  <LayoutDashboard className="w-4 h-4 text-accent-primary" aria-hidden="true" />
                  Dashboard
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 border-t border-white/5 px-4 py-3 text-left text-sm font-bold text-red-300 transition-colors hover:bg-red-500/10"
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <button onClick={login} className="btn-primary flex items-center gap-2" style={{ padding: "8px 20px", borderRadius: "10px", fontSize: "0.875rem" }}>
            <UserRound className="w-4 h-4" aria-hidden="true" />
            Login
          </button>
        )}
      </div>
    </header>
  );
}
