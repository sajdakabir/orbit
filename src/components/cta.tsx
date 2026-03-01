"use client";

import { motion } from "framer-motion";

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

      {/* Bottom abstract light area */}
      <div className="relative h-[300px] sm:h-[360px] bg-[#e8ebe4] rounded-t-2xl overflow-hidden mx-4 sm:mx-6 md:mx-12">
        {/* Top fade from white into card */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none" />

        {/* Floating abstract elements */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Grid of subtle lines */}
          <div className="absolute inset-0 opacity-[0.35]">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="absolute h-px bg-border"
                style={{
                  top: `${12 + i * 8}%`,
                  left: "8%",
                  right: "8%",
                }}
              />
            ))}
          </div>

          {/* Floating code-like boxes */}
          <div className="absolute top-[35%] left-[10%] border border-border rounded-lg px-5 py-3 bg-white/60">
            <p className="text-dim font-mono text-xs">
              <span className="text-dim/50 mr-1">✦</span> voice.transcribe()
            </p>
          </div>
          <div className="absolute top-[55%] right-[12%] border border-border rounded-lg px-5 py-3 bg-white/60">
            <p className="text-dim font-mono text-xs">
              <span className="text-dim/50 mr-1">{">"}</span> formatting...
            </p>
          </div>
          <div className="absolute top-[70%] left-[30%] border border-border rounded-lg px-4 py-2.5 bg-white/60">
            <p className="text-dim/70 font-mono text-[11px]">
              output → ready
            </p>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#e8ebe4] to-transparent pointer-events-none" />
      </div>
    </section>
  );
}
