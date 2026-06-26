"use client";

import Link from "next/link";
import Image from "next/image";
import { usePrivy } from "@privy-io/react-auth";
import { motion } from "framer-motion";

const AVATARS = [
  { img: "https://i.pravatar.cc/150?img=11", action: "Bought $WIF", pnl: "+120%" },
  { img: "https://i.pravatar.cc/150?img=22", action: "Sold $BONK", pnl: "+45%" },
  { img: "https://i.pravatar.cc/150?img=33", action: "Just Joined", pnl: "" },
  { img: "https://i.pravatar.cc/150?img=44", action: "Bought $CHAD", pnl: "+420%" },
  { img: "https://i.pravatar.cc/150?img=47", action: "Sniper Active", pnl: "" },
  { img: "https://i.pravatar.cc/150?img=60", action: "Bought $POPCAT", pnl: "+80%" },
];

export function CTA() {
  const { login } = usePrivy();

  return (
    <section className="relative py-40 px-6 flex flex-col items-center justify-center overflow-hidden min-h-[900px]">
      
      {/* Deep Space Background Glow */}
      <div className="absolute inset-0 -z-30 bg-[radial-gradient(ellipse_at_center,_rgba(30,28,60,0.8)_0%,_#060510_100%)] pointer-events-none" />

      {/* Central Radar Pulse Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none -z-25 flex items-center justify-center">
        <div className="absolute w-[250px] h-[250px] rounded-full border border-indigo-500/30 animate-[ping_6s_cubic-bezier(0,0,0.2,1)_infinite]" />
        <div className="absolute w-[250px] h-[250px] rounded-full border border-purple-500/30 animate-[ping_6s_cubic-bezier(0,0,0.2,1)_infinite]" style={{ animationDelay: '3s' }} />
      </div>

      {/* Outer Ring */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none -z-20">
        <div
          className="w-[1100px] h-[1100px] rounded-full border border-white/5 relative"
          style={{ borderStyle: "dashed", animation: "spin-slow 50s linear infinite" }}
        >
          {/* Avatar 0 */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center" style={{ animation: 'spin-slow-reverse 50s linear infinite' }}>
            <div className="relative w-14 h-14 rounded-full border-[3px] border-[#6b6ff5]/60 overflow-hidden shadow-[0_0_20px_rgba(107,111,245,0.4)]">
              <Image src={AVATARS[0].img} alt="Trader" fill sizes="100px" className="object-cover" />
            </div>
            <div className="absolute top-full mt-3 flex items-center gap-2 whitespace-nowrap px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 shadow-xl">
              <span className="text-xs font-semibold text-white">{AVATARS[0].action}</span>
              <span className="text-xs font-bold text-green-400">{AVATARS[0].pnl}</span>
            </div>
          </div>
          {/* Avatar 1 */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 flex flex-col items-center" style={{ animation: 'spin-slow-reverse 50s linear infinite' }}>
            <div className="relative w-16 h-16 rounded-full border-[3px] border-purple-500/60 overflow-hidden shadow-[0_0_20px_rgba(168,85,247,0.4)]">
              <Image src={AVATARS[1].img} alt="Trader" fill sizes="100px" className="object-cover" />
            </div>
            <div className="absolute bottom-full mb-3 flex items-center gap-2 whitespace-nowrap px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 shadow-xl">
              <span className="text-xs font-semibold text-white">{AVATARS[1].action}</span>
              <span className="text-xs font-bold text-green-400">{AVATARS[1].pnl}</span>
            </div>
          </div>
          {/* Avatar 2 */}
          <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center" style={{ animation: 'spin-slow-reverse 50s linear infinite' }}>
            <div className="relative w-12 h-12 rounded-full border-[3px] border-blue-500/60 overflow-hidden shadow-[0_0_20px_rgba(59,130,246,0.4)]">
              <Image src={AVATARS[2].img} alt="Trader" fill sizes="100px" className="object-cover" />
            </div>
            <div className="absolute left-full ml-3 flex items-center gap-2 whitespace-nowrap px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 shadow-xl">
              <span className="text-xs font-semibold text-white">{AVATARS[2].action}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Ring */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none -z-10">
        <div
          className="w-[750px] h-[750px] rounded-full border border-white/5 relative"
          style={{ borderStyle: "dashed", animation: "spin-slow-reverse 35s linear infinite" }}
        >
          {/* Avatar 3 */}
          <div className="absolute top-[15%] left-[15%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center" style={{ animation: 'spin-slow 35s linear infinite' }}>
            <div className="relative w-16 h-16 rounded-full border-[3px] border-emerald-400/60 overflow-hidden shadow-[0_0_20px_rgba(52,211,153,0.4)]">
              <Image src={AVATARS[3].img} alt="Trader" fill sizes="100px" className="object-cover" />
            </div>
            <div className="absolute top-full mt-3 flex items-center gap-2 whitespace-nowrap px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 shadow-xl">
              <span className="text-xs font-semibold text-white">{AVATARS[3].action}</span>
              <span className="text-xs font-bold text-green-400">{AVATARS[3].pnl}</span>
            </div>
          </div>
          {/* Avatar 4 */}
          <div className="absolute bottom-[15%] right-[15%] translate-x-1/2 translate-y-1/2 flex flex-col items-center" style={{ animation: 'spin-slow 35s linear infinite' }}>
            <div className="relative w-12 h-12 rounded-full border-[3px] border-pink-500/60 overflow-hidden shadow-[0_0_20px_rgba(236,72,153,0.4)]">
              <Image src={AVATARS[4].img} alt="Trader" fill sizes="100px" className="object-cover" />
            </div>
            <div className="absolute top-full mt-3 flex items-center gap-2 whitespace-nowrap px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 shadow-xl">
              <span className="text-xs font-semibold text-white">{AVATARS[4].action}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Inner Ring */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none -z-10">
        <div
          className="w-[400px] h-[400px] rounded-full border border-white/5 relative"
          style={{ borderStyle: "dashed", animation: "spin-slow 25s linear infinite" }}
        >
          {/* Avatar 5 */}
          <div className="absolute top-[10%] right-[15%] translate-x-1/2 -translate-y-1/2 flex flex-col items-center" style={{ animation: 'spin-slow-reverse 25s linear infinite' }}>
            <div className="relative w-14 h-14 rounded-full border-[3px] border-amber-500/60 overflow-hidden shadow-[0_0_20px_rgba(245,158,11,0.4)]">
              <Image src={AVATARS[5].img} alt="Trader" fill sizes="100px" className="object-cover" />
            </div>
            <div className="absolute top-full mt-3 flex items-center gap-2 whitespace-nowrap px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 shadow-xl">
              <span className="text-xs font-semibold text-white">{AVATARS[5].action}</span>
              <span className="text-xs font-bold text-green-400">{AVATARS[5].pnl}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Text Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 text-center max-w-3xl mt-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col items-center gap-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-bold tracking-wider text-white/80 uppercase">Live Network Activity</span>
          </div>

          <h2
            className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1] drop-shadow-2xl"
            style={{ color: "var(--text-primary)" }}
          >
            a trading app
            <br />
            for the rest of us
          </h2>
          <p className="text-xl md:text-2xl font-medium" style={{ color: "var(--text-secondary)" }}>
            join 500,000 traders making their name on ChadWallet
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="flex flex-col sm:flex-row items-center gap-4 mt-4"
        >
          <button onClick={login} className="btn-primary" style={{ minWidth: "220px", padding: "18px 32px", fontSize: "1.125rem" }}>
            Start trading
          </button>
          <Link
            href="https://apps.apple.com/us/app/chadwallet/id6757367474"
            target="_blank"
            className="btn-ghost"
            style={{ minWidth: "220px", padding: "18px 32px", fontSize: "1.125rem", background: "rgba(255,255,255,0.05)" }}
          >
            Download app
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
