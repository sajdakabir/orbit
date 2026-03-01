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

      {/* Bottom image/texture area */}
      <div className="relative h-[300px] sm:h-[360px] overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(241,243,246,0.6) 20%, rgba(226,233,243,0.4) 100%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundSize: "200px 200px",
          }}
        />
      </div>
    </section>
  );
}
