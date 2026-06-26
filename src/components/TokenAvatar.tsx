"use client";

import Image from "next/image";
import { useState } from "react";

interface TokenAvatarProps {
  src?: string | null;
  symbol?: string | null;
  alt?: string;
  size?: number;
  className?: string;
}

export function TokenAvatar({ src, symbol, alt, size = 36, className = "" }: TokenAvatarProps) {
  const [failed, setFailed] = useState(false);
  const label = (symbol || "?").replace(/[^a-z0-9]/gi, "").slice(0, 2).toUpperCase() || "?";
  const showImage = Boolean(src) && !failed;

  return (
    <div
      className={`relative overflow-hidden rounded-full bg-zinc-800 flex shrink-0 items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-label={alt || symbol || "Token"}
    >
      {showImage ? (
        <Image
          src={src as string}
          alt={alt || symbol || "Token"}
          fill
          sizes={`${size}px`}
          className="object-cover"
          unoptimized
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="text-[11px] font-black text-white/75">{label}</span>
      )}
    </div>
  );
}
