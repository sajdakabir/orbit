"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import HeroDemo from "./hero-demo";

export default function Hero() {
  return (
    <section className="relative pt-44 pb-28 text-center overflow-hidden">
      {/* Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_center,var(--color-glow)_0%,transparent_70%)] opacity-40 pointer-events-none" />

      <div className="relative max-w-[1120px] mx-auto px-6">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 bg-bg-card border border-border rounded-full text-[13px] font-medium text-muted"
        >
          <span className="w-1.5 h-1.5 bg-foreground rounded-full animate-pulse" />
          Journal • Notes • Dictation — All-in-one
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-[80px] font-extrabold tracking-[-0.035em] leading-[1.05] mb-6 bg-gradient-to-b from-foreground via-foreground to-dim bg-clip-text text-transparent"
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

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2.5 px-7 py-3.5 text-muted text-[15px] font-medium border border-border rounded-full hover:text-foreground hover:border-dim transition-all"
          >
            See how it works
            <ArrowRight className="w-4 h-4" />
          </a>
        </motion.div>

        {/* Animated app demo */}
        <HeroDemo />
      </div>
    </section>
  );
}
