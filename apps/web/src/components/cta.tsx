"use client";

import { motion } from "framer-motion";
import { Twitter, Github, Linkedin } from "lucide-react";
import OrbitIcon from "./orbit-icon";

export default function Cta() {
  return (
    <section id="download" className="relative text-center overflow-hidden">
      <div className="relative px-6 md:px-12 pt-28 pb-16">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex items-center justify-center gap-2 mb-8"
        >
          <span className="w-1.5 h-1.5 bg-foreground rounded-full" />
          <span className="text-sm text-muted font-medium">Start Speaking</span>
        </motion.div>

        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-[family-name:var(--font-manrope)] text-[28px] sm:text-[36px] md:text-[44px] font-normal tracking-[-0.02em] leading-[1.2] mb-6 max-w-[640px] mx-auto"
        >
          The future is voice-first,
          <br />
          your workflow should be too
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-[15px] text-muted max-w-[520px] mx-auto leading-relaxed mb-10"
        >
          No setup, no learning curve, no switching apps. Download Orbit and
          start writing at the speed of thought — it&apos;s free to get started.
        </motion.p>

        {/* Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <a
            href=""
            download
            className="inline-flex items-center gap-2 px-8 py-3.5 text-[15px] font-medium border border-border rounded-full hover:text-foreground hover:border-foreground transition-all"
          >
            Download for Mac
            <span className="text-muted">&rarr;</span>
          </a>
        </motion.div>
      </div>

      {/* Dark area — orbit + footer merged */}
      <div className="relative bg-[#132f38] rounded-t-[40px] overflow-hidden mx-0">
        {/* Logo + Tagline — above the orbit */}
        <div className="relative z-20 px-8 md:px-12 pt-14 pb-0">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="text-white/50">
              <OrbitIcon width={18} height={16} />
            </div>
            <span className="text-lg font-semibold text-white/70 tracking-tight">
              Orbit
            </span>
          </div>
          <p className="text-sm text-white/25 leading-relaxed max-w-[320px]">
            Your second brain, powered by voice.
            <br />
            Dictate anywhere, format everything.
          </p>
        </div>

        {/* Orbit visual area — pushed down */}
        <div className="relative h-[420px] sm:h-[480px]">
          {/* Orbital rings SVG */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              viewBox="0 0 800 600"
              fill="none"
              className="w-full h-full"
              preserveAspectRatio="xMidYMid meet"
            >
              {Array.from({ length: 14 }, (_, i) => {
                const rx = 80 + i * 28;
                const ry = 40 + i * 18;
                const rotation = -20 + i * 3;
                const opacity = 0.03 + i * 0.015;
                return (
                  <ellipse
                    key={i}
                    cx={400}
                    cy={300}
                    rx={rx}
                    ry={ry}
                    transform={`rotate(${rotation} 400 300)`}
                    stroke="white"
                    strokeWidth={0.8}
                    opacity={opacity}
                  />
                );
              })}

              <defs>
                <radialGradient id="orbitGlow" cx="50%" cy="50%" r="30%">
                  <stop offset="0%" stopColor="#ede6f3" stopOpacity="0.07" />
                  <stop offset="100%" stopColor="#ede6f3" stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect x="0" y="0" width="800" height="600" fill="url(#orbitGlow)" />
            </svg>
          </div>

          {/* Center orbit icon */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-white/10">
              <OrbitIcon width={80} height={72} />
            </div>
          </div>

          {/* Floating code snippets */}
          <div className="absolute top-[30%] left-[8%] border border-white/[0.06] rounded-lg px-5 py-3 bg-white/[0.04] backdrop-blur-sm z-10">
            <p className="text-white/25 font-mono text-xs">
              <span className="text-white/15 mr-1">✦</span> voice.transcribe()
            </p>
          </div>
          <div className="absolute top-[48%] right-[10%] border border-white/[0.06] rounded-lg px-5 py-3 bg-white/[0.04] backdrop-blur-sm z-10">
            <p className="text-white/25 font-mono text-xs">
              <span className="text-white/15 mr-1">{">"}</span> formatting...
            </p>
          </div>
          <div className="absolute top-[66%] left-[25%] border border-white/[0.06] rounded-lg px-4 py-2.5 bg-white/[0.04] backdrop-blur-sm z-10">
            <p className="text-white/20 font-mono text-[11px]">
              output → ready
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="relative px-8 md:px-12 pb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6 border-t border-white/[0.06]">
            <p className="text-xs text-white/20">
              Orbit &middot; {new Date().getFullYear()} All Rights Reserved
            </p>

            <div className="flex items-center gap-5">
              <a
                href="https://x.com/sajdakabir"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/20 hover:text-white/50 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/20 hover:text-white/50 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="https://github.com/sajdakabir/orbit"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/20 hover:text-white/50 transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
            </div>

            <div className="flex items-center gap-1 text-xs text-white/20">
              <a href="#" className="hover:text-white/50 transition-colors">
                Terms of Service
              </a>
              <span>&middot;</span>
              <a href="#" className="hover:text-white/50 transition-colors">
                Privacy Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
