"use client";

import Image from "next/image";
import { motion, type Variants } from "framer-motion";

const FEATURES = [
  {
    tag: "INSTANT TRADING",
    title: "buy trending tokens before the crowd",
    img: "/assets/flow/buy-sell-4.png",
    span: "col-span-1",
    color: "rgba(107, 111, 245, 0.5)", // purple
  },
  {
    tag: "SOCIAL KOL FEED",
    title: "discover and follow top traders",
    img: "/assets/flow/kol-4.png",
    span: "col-span-1",
    color: "rgba(168, 85, 247, 0.5)", // fuchsia
  },
  {
    tag: "MEME COIN RADAR",
    title: "catch every new launch before it pumps",
    img: "/assets/flow/memecoin-4.png",
    span: "col-span-1",
    color: "rgba(236, 72, 153, 0.5)", // pink
  },
  {
    tag: "TOKEN LAUNCH",
    title: "launch your own token in one tap",
    img: "/assets/flow/launch-4.png",
    span: "col-span-1 md:col-span-2",
    color: "rgba(59, 130, 246, 0.5)", // blue
  },
  {
    tag: "PORTFOLIO",
    title: "track your gains. flex your pnl.",
    img: "/assets/flow/portfolio-4.png",
    span: "col-span-1",
    color: "rgba(52, 211, 153, 0.5)", // emerald
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export function Features() {
  return (
    <section id="features" className="relative py-24 w-[85%] max-w-[1400px] mx-auto">
      
      {/* Subtle background glow for the whole section */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[80%] rounded-[100%] bg-[radial-gradient(ellipse_at_center,_rgba(107,111,245,0.08)_0%,_transparent_60%)] pointer-events-none -z-10" />

      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="flex flex-col gap-4 mb-14"
      >
        <div className="inline-flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent-primary animate-pulse" />
          <div className="feature-tag tracking-widest text-sm">NEVER MISS OUT AGAIN</div>
        </div>
        <h2
          className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05]"
          style={{ color: "var(--text-primary)" }}
        >
          the only social-first
          <br className="hidden md:block" /> Solana trading app
        </h2>
        <p className="text-xl md:text-2xl mt-2 font-medium" style={{ color: "var(--text-secondary)" }}>
          From memecoins to viral tokens — trade any crypto in seconds.
        </p>
      </motion.div>

      {/* Feature bento grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8"
      >
        {FEATURES.map((f) => (
          <motion.div
            variants={itemVariants}
            key={f.tag}
            className={`group relative glass-card rounded-[32px] flex flex-col overflow-hidden gap-2 pt-8 border border-white/5 bg-[#0e0d1c]/80 hover:bg-[#121124]/90 transition-colors duration-500 shadow-2xl ${f.span}`}
            style={{ minHeight: "400px" }}
          >
            {/* Top Text Content */}
            <div className="px-8 relative z-10 flex flex-col gap-3">
              <div className="feature-tag text-xs font-bold tracking-widest opacity-80" style={{ color: f.color.replace('0.5', '1') }}>
                {f.tag}
              </div>
              <h3
                className="text-3xl md:text-4xl font-bold leading-[1.1] tracking-tight"
                style={{ color: "var(--text-primary)" }}
              >
                {f.title}
              </h3>
            </div>

            {/* Bottom Image Container with Blur, Glows, and Masks */}
            <div className="flex-1 relative mt-6 w-full flex justify-center items-end pointer-events-none">
              
              {/* The Image Container with Premium Blurs */}
              <div className="relative w-full h-[110%] bottom-[-5%] transition-transform duration-700 group-hover:-translate-y-2 group-hover:scale-[1.02]">
                <Image
                  src={f.img}
                  alt={f.tag}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-contain object-bottom drop-shadow-2xl"
                />
                
                {/* 1. Premium Edge Blur Overlay (Depth of Field) */}
                <div 
                  className="absolute inset-0 backdrop-blur-[12px] z-10"
                  style={{ 
                    WebkitMaskImage: "radial-gradient(ellipse at center, transparent 50%, black 90%)",
                    maskImage: "radial-gradient(ellipse at center, transparent 50%, black 90%)"
                  }}
                />
                
                {/* 2. Soft Dark Vignette to smoothly blend the image into the card background */}
                <div 
                  className="absolute inset-0 z-20"
                  style={{
                    background: "radial-gradient(ellipse at center, transparent 40%, rgba(14,13,28,0.7) 80%, rgba(14,13,28,1) 100%)"
                  }}
                />
              </div>
            </div>

            {/* Hover border highlight effect */}
            <div className="absolute inset-0 border-2 border-transparent group-hover:border-white/10 rounded-[32px] transition-colors duration-700 pointer-events-none" />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
