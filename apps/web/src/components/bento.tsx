"use client";

import { motion } from "framer-motion";

const items = [
  {
    emoji: "🎙️",
    title: "Whisper-quiet mode",
    desc: "Speak softly or whisper — Orbit still hears you clearly, even with noisy backgrounds.",
  },
  {
    emoji: "🗣️",
    title: "Voice commands",
    desc: 'Say "new line", "bullet point", or "delete that" and see instant formatting changes.',
  },
  {
    emoji: "🌍",
    title: "Multi-language",
    desc: "Speak in any language and Orbit transcribes accurately. Switch mid-sentence if you want.",
  },
  {
    emoji: "⚡",
    title: "Lightning fast",
    desc: "Sub-200ms latency. Text appears as you speak with zero perceptible delay.",
  },
  {
    emoji: "✨",
    title: "Style matching",
    desc: "Orbit adapts to your writing voice. Professional emails, casual messages — it sounds like you.",
  },
  {
    emoji: "📝",
    title: "Smart notes",
    desc: "Automatically organize and tag your dictated notes. Search them instantly later.",
  },
];

const cardV = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.08 },
  }),
};

export default function Bento() {
  return (
    <section className="py-28">
      <div className="max-w-[1120px] mx-auto px-6">
        <motion.span
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="block text-[13px] font-semibold text-accent uppercase tracking-widest mb-4"
        >
          And more
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.1] mb-4"
        >
          The details matter
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-[17px] text-muted max-w-[560px] leading-relaxed mb-16"
        >
          Small touches that make a big difference in your daily workflow.
        </motion.p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              variants={cardV}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i}
              className="p-10 bg-bg-card border border-border rounded-2xl hover:bg-bg-card-hover hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="text-[28px] mb-5">{item.emoji}</div>
              <h4 className="text-base font-bold tracking-tight mb-2">
                {item.title}
              </h4>
              <p className="text-sm text-muted leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
