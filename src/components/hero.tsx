"use client";

import { motion } from "framer-motion";
import { Apple, ArrowRight } from "lucide-react";

const bars = Array.from({ length: 19 }, (_, i) => ({
  delay: (i * 0.08) % 0.5,
  h: 12 + Math.sin(i * 0.8) * 22 + Math.random() * 16,
}));

export default function Hero() {
  return (
    <section className="relative pt-44 pb-28 text-center overflow-hidden">
      {/* Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_center,var(--color-accent-glow)_0%,transparent_70%)] opacity-40 pointer-events-none" />

      <div className="relative max-w-[1120px] mx-auto px-6">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 bg-accent-soft border border-accent/15 rounded-full text-[13px] font-medium text-[#b4a7f5]"
        >
          <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
          Now available on macOS
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-[80px] font-extrabold tracking-[-0.035em] leading-[1.05] mb-6 bg-gradient-to-b from-foreground via-foreground to-dim bg-clip-text text-transparent"
        >
          Your voice is the
          <br />
          new keyboard
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg text-muted max-w-[540px] mx-auto mb-12 leading-relaxed"
        >
          Orbit turns your speech into perfect text, anywhere on your computer.
          Just press a hotkey and speak naturally.
        </motion.p>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <a
            href="#download"
            className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-foreground text-bg text-[15px] font-semibold rounded-full hover:opacity-90 hover:-translate-y-px hover:shadow-[0_8px_30px_rgba(255,255,255,0.08)] transition-all"
          >
            <Apple className="w-[18px] h-[18px]" />
            Download for Mac
          </a>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2.5 px-7 py-3.5 text-muted text-[15px] font-medium border border-border rounded-full hover:text-foreground hover:border-dim transition-all"
          >
            See how it works
            <ArrowRight className="w-4 h-4" />
          </a>
        </motion.div>

        {/* App mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative max-w-[900px] mx-auto rounded-2xl overflow-hidden border border-border bg-bg-raised"
        >
          <div className="w-full aspect-[16/10] bg-gradient-to-br from-bg-card to-bg-raised relative overflow-hidden">
            {/* Title bar */}
            <div className="absolute top-0 inset-x-0 h-11 bg-black/30 backdrop-blur-xl flex items-center px-4 gap-2">
              <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <span className="w-3 h-3 rounded-full bg-[#28c840]" />
            </div>

            {/* Content */}
            <div className="flex flex-col items-center gap-6 pt-20 pb-16 px-10">
              {/* Pill */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/15 border border-accent/25 rounded-full text-[13px] text-[#b4a7f5]">
                <span className="relative w-2.5 h-2.5 bg-red-500 rounded-full">
                  <span className="absolute -inset-1 border-2 border-red-500 rounded-full animate-ping" />
                </span>
                Listening...
              </div>

              {/* Waveform */}
              <div className="flex items-center gap-[3px] h-[60px]">
                {bars.map((b, i) => (
                  <div
                    key={i}
                    className="w-1 rounded-full bg-accent"
                    style={{
                      height: `${b.h}px`,
                      animation: `wave 1.2s ease-in-out ${b.delay}s infinite`,
                    }}
                  />
                ))}
              </div>

              {/* Typed text */}
              <p className="text-xl sm:text-[22px] font-medium text-foreground overflow-hidden whitespace-nowrap border-r-2 border-accent animate-[typing_3.5s_steps(50)_infinite]">
                Hey team, let&apos;s sync on the project timeline tomorrow
              </p>
            </div>
          </div>

          {/* Bottom glow bar */}
          <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-2/5 h-1 bg-gradient-to-r from-transparent via-accent to-transparent rounded-full blur-sm" />
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes wave {
          0%,
          100% {
            height: 12px;
            opacity: 0.4;
          }
          50% {
            opacity: 1;
          }
        }
        @keyframes typing {
          0% {
            width: 0;
          }
          60%,
          100% {
            width: 100%;
          }
        }
      `}</style>
    </section>
  );
}
