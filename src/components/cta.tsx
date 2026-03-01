"use client";

import { motion } from "framer-motion";
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

      {/* Bottom abstract orbit area */}
      <div className="relative h-[340px] sm:h-[400px] bg-[#132f38] rounded-t-[32px] overflow-hidden mx-0">
        {/* Top fade from white into dark */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white via-white/60 to-transparent z-10 pointer-events-none" />

        {/* Orbital rings SVG */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            viewBox="0 0 800 500"
            fill="none"
            className="w-full h-full"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Concentric orbit ellipses — mimicking the icon's curved lines */}
            {Array.from({ length: 14 }, (_, i) => {
              const rx = 80 + i * 28;
              const ry = 40 + i * 18;
              const rotation = -20 + i * 3;
              const opacity = 0.03 + i * 0.015;
              return (
                <ellipse
                  key={i}
                  cx={400}
                  cy={280}
                  rx={rx}
                  ry={ry}
                  transform={`rotate(${rotation} 400 280)`}
                  stroke="white"
                  strokeWidth={0.8}
                  opacity={opacity}
                />
              );
            })}

            {/* Subtle radial glow at center */}
            <defs>
              <radialGradient id="orbitGlow" cx="50%" cy="56%" r="30%">
                <stop offset="0%" stopColor="#ede6f3" stopOpacity="0.07" />
                <stop offset="100%" stopColor="#ede6f3" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect x="0" y="0" width="800" height="500" fill="url(#orbitGlow)" />
          </svg>
        </div>

        {/* Center orbit icon */}
        <div className="absolute inset-0 flex items-center justify-center z-10 pt-10">
          <div className="text-white/10">
            <OrbitIcon width={80} height={72} />
          </div>
        </div>

        {/* Floating code snippets */}
        <div className="absolute top-[40%] left-[8%] border border-white/[0.06] rounded-lg px-5 py-3 bg-white/[0.04] backdrop-blur-sm z-10">
          <p className="text-white/25 font-mono text-xs">
            <span className="text-white/15 mr-1">✦</span> voice.transcribe()
          </p>
        </div>
        <div className="absolute top-[55%] right-[10%] border border-white/[0.06] rounded-lg px-5 py-3 bg-white/[0.04] backdrop-blur-sm z-10">
          <p className="text-white/25 font-mono text-xs">
            <span className="text-white/15 mr-1">{">"}</span> formatting...
          </p>
        </div>
        <div className="absolute top-[72%] left-[25%] border border-white/[0.06] rounded-lg px-4 py-2.5 bg-white/[0.04] backdrop-blur-sm z-10">
          <p className="text-white/20 font-mono text-[11px]">
            output → ready
          </p>
        </div>

        {/* Bottom fade into footer */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#112a33] to-transparent pointer-events-none" />
      </div>
    </section>
  );
}
