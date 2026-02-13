"use client";

import { motion } from "framer-motion";

const steps = [
  {
    num: "1",
    title: "Press a hotkey",
    desc: "Tap your shortcut to activate Orbit. A small floating pill appears to let you know it's listening.",
    visual: (
      <div className="mt-8 p-4 bg-bg-raised border border-border-subtle rounded-xl flex items-center gap-3">
        <span className="px-3 py-1.5 bg-bg border border-border rounded-md text-xs font-semibold font-mono text-muted">
          ⌥
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
    title: "Speak naturally",
    desc: "Talk like you normally would. Orbit handles accents, filler words, background noise, and even whispers.",
    visual: (
      <div className="mt-8 p-4 bg-bg-raised border border-border-subtle rounded-xl flex flex-col gap-2">
        <span className="text-[13px] text-dim">You say:</span>
        <span className="text-sm text-foreground italic">
          &ldquo;Hey can you send me the deck by tomorrow thanks&rdquo;
        </span>
      </div>
    ),
  },
  {
    num: "3",
    title: "Perfect text appears",
    desc: "Orbit transcribes, punctuates, and formats your speech in real-time. Text appears right where you need it.",
    visual: (
      <div className="mt-8 p-4 bg-bg-raised border border-border-subtle rounded-xl flex flex-col gap-2">
        <span className="text-[13px] text-dim">Orbit types:</span>
        <span className="text-sm text-foreground">
          &ldquo;Hey, can you send me the deck by tomorrow? Thanks!&rdquo;
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
          Three steps to faster writing
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-[17px] text-muted max-w-[560px] leading-relaxed mb-16"
        >
          No setup. No learning curve. Just speak and watch perfect text appear
          wherever your cursor is.
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
