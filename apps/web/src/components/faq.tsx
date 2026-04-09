"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "Is Orbit free to use?",
    a: "Yes! Orbit offers a generous free tier so you can start dictating right away. No credit card needed. Premium features are available for power users who want unlimited dictation and advanced AI features.",
  },
  {
    q: "Is my voice data private and secure?",
    a: "Absolutely. Audio is processed in real-time and immediately discarded. We don't store recordings, sell data, or train models on your voice. Privacy isn't an afterthought — it's foundational.",
  },
  {
    q: "Which platforms does Orbit support?",
    a: "Orbit is currently available on macOS with Windows support coming soon. It works system-wide — anywhere you can type, Orbit can dictate.",
  },
  {
    q: "Does it work with languages other than English?",
    a: "Yes. Orbit supports multiple languages and can even handle mid-sentence language switching. It understands accents, dialects, and regional terms with high accuracy.",
  },
  {
    q: "How is this different from built-in dictation?",
    a: "Built-in dictation just transcribes. Orbit understands context, formats intelligently, corrects grammar, and adapts to your writing style. It's the difference between a basic recorder and an intelligent writing assistant.",
  },
  {
    q: "Can I use voice commands for formatting?",
    a: 'Yes! Say "new line", "bullet point", "comma", "period", "delete that", and more. Orbit turns your natural instructions into perfectly formatted text.',
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-6 text-left text-base font-semibold text-foreground hover:text-accent transition-colors"
      >
        {q}
        <ChevronDown
          className={`w-5 h-5 text-dim shrink-0 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          open ? "max-h-48" : "max-h-0"
        }`}
      >
        <p className="pb-6 text-[15px] text-muted leading-relaxed">{a}</p>
      </div>
    </div>
  );
}

export default function Faq() {
  return (
    <section id="faq" className="py-28">
      <div className="max-w-[1120px] mx-auto px-6">
        <div className="text-center">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="block text-[13px] font-semibold text-accent uppercase tracking-widest mb-4"
          >
            FAQ
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.1] mb-4"
          >
            Questions? We&apos;ve got answers
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-[17px] text-muted max-w-[560px] mx-auto leading-relaxed mb-16"
          >
            Everything you need to know about getting started.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-[680px] mx-auto"
        >
          {faqs.map((f) => (
            <FaqItem key={f.q} q={f.q} a={f.a} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
