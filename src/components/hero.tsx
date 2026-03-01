"use client";

import { motion } from "framer-motion";
import HeroDemo from "./hero-demo";

export default function Hero() {
  return (
    <section className="relative pt-40 pb-24 text-center overflow-hidden">
      <div className="relative max-w-[1120px] mx-auto px-6">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 bg-gradient-to-r from-[#faf8fc] to-[#fdf6f4] border border-[#ede6f3]/40 rounded-full text-[13px] font-medium text-foreground"
        >
          <span className="w-1.5 h-1.5 bg-foreground rounded-full animate-pulse" />
          Journal &middot; Notes &middot; Dictation — All-in-one
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-[family-name:var(--font-manrope)] text-[32px] sm:text-[40px] md:text-[48px] font-normal tracking-[-0.02em] leading-[1.3] mb-6 text-foreground"
        >
          Your second brain,
          <br />
          powered by voice
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg text-muted max-w-[540px] mx-auto mb-12 leading-relaxed"
        >
          Journal, take notes, and dictate in any app—all powered by your voice.
          One workspace to replace multiple apps.
        </motion.p>

        {/* Animated app demo */}
        <HeroDemo />
      </div>
    </section>
  );
}
