"use client";

import { motion } from "framer-motion";
import { Apple } from "lucide-react";

export default function Cta() {
  return (
    <section id="download" className="py-28 text-center relative">
      {/* Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[radial-gradient(ellipse_at_center,var(--color-accent-glow)_0%,transparent_70%)] opacity-30 pointer-events-none" />

      <div className="relative max-w-[1120px] mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.1] mb-6"
        >
          Ready to ditch the keyboard?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-[17px] text-muted max-w-[480px] mx-auto leading-relaxed mb-10"
        >
          Download Orbit and start writing at the speed of thought. It&apos;s
          free to get started.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row justify-center gap-4"
        >
          <a
            href="/Orbit-local-Installer.dmg"
            download
            className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-foreground text-bg text-[15px] font-semibold rounded-full hover:opacity-90 hover:-translate-y-px hover:shadow-[0_8px_30px_rgba(255,255,255,0.08)] transition-all"
          >
            <Apple className="w-[18px] h-[18px]" />
            Download for Mac
          </a>
          <a
            href="#"
            className="inline-flex items-center gap-2.5 px-7 py-3.5 text-muted text-[15px] font-medium border border-border rounded-full hover:text-foreground hover:border-dim transition-all"
          >
            Windows (Coming soon)
          </a>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-4 text-[13px] text-dim"
        >
          Available on macOS 12+. Free to get started.
        </motion.p>
      </div>
    </section>
  );
}
