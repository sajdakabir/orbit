"use client";

import { motion } from "framer-motion";

const apps = [
  "Slack",
  "Gmail",
  "Notion",
  "Messages",
  "Google Docs",
  "VS Code",
  "Anywhere",
];

export default function Logos() {
  return (
    <section className="py-16 border-y border-border-subtle">
      <div className="max-w-[1120px] mx-auto px-6">
        <p className="text-center text-[13px] font-medium text-dim uppercase tracking-widest mb-8">
          Works seamlessly with
        </p>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex justify-center items-center gap-10 flex-wrap"
        >
          {apps.map((name) => (
            <span
              key={name}
              className="text-[15px] font-semibold text-dim hover:text-muted transition-colors"
            >
              {name}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
