"use client";

import { motion } from "framer-motion";

const apps = [
  "Slack",
  "Gmail",
  "Notion",
  "Telegram",
  "VS Code",
  "Google Docs",
  "Messages",
  "Discord",
  "ChatGPT",
  "Cursor",
];

export default function Integrations() {
  return (
    <section id="integrations" className="py-28">
      <div className="max-w-[1120px] mx-auto px-6 text-center">
        <motion.span
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="block text-[13px] font-semibold text-accent uppercase tracking-widest mb-4"
        >
          Integrations
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.1] mb-4 mx-auto"
        >
          Works everywhere you type
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-[17px] text-muted max-w-[560px] mx-auto leading-relaxed mb-16"
        >
          Orbit isn&apos;t limited to one app. Anywhere there&apos;s a cursor,
          Orbit delivers your words.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex justify-center flex-wrap gap-4 max-w-[720px] mx-auto"
        >
          {apps.map((name) => (
            <span
              key={name}
              className="inline-flex items-center gap-2.5 px-5 py-3 bg-bg-card border border-border rounded-full text-sm font-medium text-muted hover:bg-bg-card-hover hover:border-dim hover:text-foreground transition-all"
            >
              {name}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
