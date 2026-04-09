"use client";

import { motion } from "framer-motion";

const steps = [
  {
    num: "1",
    title: "Open Orbit",
    desc: "Launch the app to access your dashboard, daily journal, notes, and library. Everything synced and organized.",
    visual: (
      <div className="mt-8 p-4 bg-bg-raised border border-border-subtle rounded-xl flex items-center gap-3">
        <span className="px-3 py-1.5 bg-bg border border-border rounded-md text-xs font-semibold font-mono text-muted">
          ⌘
        </span>
        <span className="text-[13px] text-dim">+</span>
        <span className="px-3 py-1.5 bg-bg border border-border rounded-md text-xs font-semibold font-mono text-muted">
          Space
        </span>
      </div>
    ),
  },
  {
    num: "2",
    title: "Use your voice anywhere",
    desc: "Press your hotkey and speak. Works in Orbit or any app on your Mac. Perfect for emails, docs, messages, and more.",
    visual: (
      <div className="mt-8 p-4 bg-bg-raised border border-border-subtle rounded-xl flex flex-col gap-2">
        <span className="text-[13px] text-dim">Journal · Notes · Slack · Gmail</span>
        <span className="text-sm text-foreground">
          &ldquo;Just press ⌥ Space and start speaking&rdquo;
        </span>
      </div>
    ),
  },
  {
    num: "3",
    title: "Track your productivity",
    desc: "See your weekly streaks, speaking speed, and all interactions. Build the habit with visual feedback.",
    visual: (
      <div className="mt-8 p-4 bg-bg-raised border border-border-subtle rounded-xl flex flex-col gap-2">
        <span className="text-[13px] text-dim">This week:</span>
        <span className="text-sm text-foreground">
          7 day streak · 156 WPM · 2,450 words
        </span>
      </div>
    ),
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.12 },
  }),
};

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-28">
      <div className="max-w-[1120px] mx-auto px-6">
        <motion.span
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="block text-[13px] font-semibold text-accent uppercase tracking-widest mb-4"
        >
          How it works
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.1] mb-4"
        >
          Voice-first productivity
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-[17px] text-muted max-w-[560px] leading-relaxed mb-16"
        >
          Use Orbit for journaling, note-taking, or global dictation in any app.
          One hotkey, infinite possibilities.
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i}
              className="p-10 bg-bg-card border border-border rounded-2xl hover:bg-bg-card-hover hover:border-accent/20 hover:-translate-y-1 transition-all duration-300"
            >
              <div className="w-10 h-10 bg-accent-soft rounded-lg flex items-center justify-center text-base font-bold text-accent mb-6">
                {step.num}
              </div>
              <h3 className="text-xl font-bold tracking-tight mb-3">
                {step.title}
              </h3>
              <p className="text-[15px] text-muted leading-relaxed">
                {step.desc}
              </p>
              {step.visual}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
