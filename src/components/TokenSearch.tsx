"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { TokenAvatar } from "./TokenAvatar";
import type { SearchResult } from "@/lib/birdeye";

export function TokenSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const doSearch = useCallback(async (keyword: string) => {
    // Cancel previous request
    if (abortRef.current) abortRef.current.abort();
    
    if (!keyword.trim()) {
      setResults([]);
      setIsOpen(false);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);

    try {
      const res = await fetch(`/api/search?keyword=${encodeURIComponent(keyword)}`, {
        signal: controller.signal,
      });
      const json = await res.json();
      if (json.results && json.results.length > 0) {
        setResults(json.results);
        setIsOpen(true);
      } else {
        setResults([]);
        setIsOpen(false);
      }
    } catch (err: unknown) {
      const isAbort = err instanceof DOMException && err.name === "AbortError";
      if (!isAbort) {
        console.error("Search error:", err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  const handleSelect = (address: string) => {
    setIsOpen(false);
    setQuery("");
    setResults([]);
    router.push(`/trade/${address}`);
  };

  const formatVol = (num: number) => {
    if (!num) return "$0";
    if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
    return `$${num.toFixed(0)}`;
  };

  return (
    <div ref={wrapperRef} style={{ position: "relative", width: "100%", maxWidth: "420px", zIndex: 100 }}>
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <svg
          style={{ position: "absolute", left: "14px", width: "16px", height: "16px", color: "#71717a", pointerEvents: "none" }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search tokens..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setIsOpen(true); }}
          style={{
            width: "100%",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "9999px",
            padding: "10px 16px 10px 40px",
            fontSize: "14px",
            color: "#fff",
            outline: "none",
          }}
        />
        {loading && (
          <div style={{
            position: "absolute", right: "14px",
            width: "16px", height: "16px",
            border: "2px solid #6b6ff5", borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "spin 0.6s linear infinite",
          }} />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div style={{
          position: "absolute",
          top: "100%",
          marginTop: "8px",
          width: "100%",
          background: "#15141f",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
          maxHeight: "360px",
          overflowY: "auto",
          zIndex: 200,
        }}>
          {results.map((token) => (
            <button
              key={token.address}
              onClick={() => handleSelect(token.address)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                width: "100%",
                textAlign: "left",
                background: "none",
                border: "none",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                cursor: "pointer",
                color: "#fff",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              <TokenAvatar src={token.logoURI} symbol={token.symbol} alt={token.symbol} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 700, fontSize: "14px" }}>{token.symbol}</span>
                  <span style={{ fontSize: "11px", color: "#a1a1aa" }}>Vol: {formatVol(token.volume24hUSD)}</span>
                </div>
                <div style={{ fontSize: "12px", color: "#71717a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {token.name}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
