"use client";

import Link from "next/link";
import Image from "next/image";
import { usePrivy } from "@privy-io/react-auth";
import { motion } from "framer-motion";

export function Hero() {
  const { login } = usePrivy();

  return (
    <section className="relative z-0 flex flex-col items-center justify-center overflow-hidden min-h-[110vh] pt-32 pb-20">
      {/* Animated Astronaut Space Background */}
      <motion.div
        className="absolute inset-0 -z-20 w-full h-full"
        animate={{
          scale: [1, 1.05, 1],
          y: [0, -15, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Image
          src="/assets/astronaut_bg.png"
          alt="Premium Space Astronaut Background"
          fill
          sizes="100vw"
          className="object-cover opacity-[0.55]"
          priority
        />
      </motion.div>

      {/* Vignette & Gradients to ensure text readability */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#060510]/80 via-transparent to-[#060510] pointer-events-none" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_#060510_100%)] opacity-80 pointer-events-none" />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-5xl mx-auto gap-8">
        
        {/* Logo mark */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center gap-4 mb-2"
        >
          <div className="relative w-20 h-20 md:w-24 md:h-24 animate-float">
            <Image src="/assets/logo/light.png" alt="ChadWallet Logo" fill sizes="100px" className="object-contain" />
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-6xl md:text-8xl font-black tracking-tight leading-[1.05]"
          style={{ color: "var(--text-primary)" }}
        >
          where chads
          <br />
          <span
            className="bg-clip-text text-transparent drop-shadow-2xl"
            style={{ backgroundImage: "linear-gradient(135deg, #6b6ff5 0%, #a78bfa 50%, #e879f9 100%)" }}
          >
            become legends.
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="text-xl md:text-3xl max-w-2xl leading-relaxed font-medium"
          style={{ color: "var(--text-secondary)" }}
        >
          Trade Solana memecoins instantly. Self-custody. Zero complexity.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="flex flex-col sm:flex-row items-center gap-4 mt-4"
        >
          <button onClick={login} className="btn-primary" style={{ minWidth: "220px", padding: "18px 32px", fontSize: "1.125rem" }}>
            Start Trading
          </button>
          <Link href="#features" className="btn-ghost" style={{ minWidth: "220px", padding: "18px 32px", fontSize: "1.125rem" }}>
            Learn More
          </Link>
        </motion.div>
      </div>

      {/* Floating phone mockup - Enhanced and adjusted */}
      <motion.div
        initial={{ opacity: 0, y: 100, rotate: 0 }}
        animate={{ opacity: 1, y: 0, rotate: -6 }}
        transition={{ duration: 1.2, delay: 0.6, ease: "easeOut" }}
        className="relative z-20 w-full max-w-[280px] md:max-w-[340px] mt-24"
      >
        <motion.div
          animate={{ y: [-10, 10, -10] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="relative mx-auto rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden border-[4px] md:border-[8px] bg-black"
          style={{
            borderColor: "rgba(107,111,245,0.4)",
            boxShadow: "0 20px 80px rgba(107,111,245,0.3), 0 0 0 1px rgba(255,255,255,0.1) inset",
            aspectRatio: "9/19",
          }}
        >
          <video
            src="/assets/video/chadwallet.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover scale-[1.02]"
          />
          {/* Inner reflection/glare */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/5 to-transparent" />
        </motion.div>
        
        {/* Deep ambient glow behind phone */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[80px] opacity-30 -z-10 pointer-events-none"
          style={{ background: "var(--accent-primary)" }}
        />
      </motion.div>
      
    </section>
  );
}
